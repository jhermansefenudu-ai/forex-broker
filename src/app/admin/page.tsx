"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useNotification } from "@/components/ui/NotificationProvider";
import { createClient } from "@/lib/supabase";
import styles from "./page.module.css";

interface Profile {
    id: string;
    full_name: string;
    email?: string;
    role: 'user' | 'admin';
    kyc_status: 'not_started' | 'pending' | 'verified' | 'rejected';
    id_doc_url?: string;
    address_doc_url?: string;
    created_at: string;
}

interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'profit' | 'loss';
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    profiles?: { full_name: string };
}

interface AdminStats {
    totalUsers: number;
    totalDeposited: number;
    pendingKyc: number;
    pendingWithdrawals: number;
}

export default function AdminDashboard() {
    const supabase = createClient();
    const { showToast } = useNotification();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalDeposited: 0,
        pendingKyc: 0,
        pendingWithdrawals: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'kyc' | 'withdrawals'>('overview');

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant: 'danger' | 'warning';
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'warning'
    });

    const [previewDoc, setPreviewDoc] = useState<{
        isOpen: boolean;
        url: string;
        title: string;
    }>({
        isOpen: false,
        url: '',
        title: ''
    });

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsAdmin(false);
                setIsLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                setIsAdmin(false);
                setIsLoading(false);
                return;
            }
            setIsAdmin(true);

            // Fetch profiles
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profileData) setProfiles(profileData);

            // Fetch all transactions for stats and withdrawals
            const { data: transData } = await supabase
                .from('transactions')
                .select('*, profiles(full_name)')
                .order('created_at', { ascending: false });

            if (transData) {
                setTransactions(transData as unknown as Transaction[]);

                // Calculate stats
                const totalDeposited = transData
                    .filter(t => t.type === 'deposit' && t.status === 'completed')
                    .reduce((sum, t) => sum + (t.amount || 0), 0);

                setStats({
                    totalUsers: profileData?.length || 0,
                    totalDeposited,
                    pendingKyc: profileData?.filter(p => p.kyc_status === 'pending').length || 0,
                    pendingWithdrawals: transData.filter(t => t.type === 'withdrawal' && t.status === 'pending').length || 0
                });
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();

        // Real-time subscriptions
        const profileChannel = supabase
            .channel('admin-profiles')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
            .subscribe();

        const transChannel = supabase
            .channel('admin-transactions')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(transChannel);
        };
    }, [fetchData, supabase]);

    const handleKycAction = async (userId: string, status: 'verified' | 'rejected') => {
        const { error } = await supabase.from('profiles').update({ kyc_status: status }).eq('id', userId);
        if (error) {
            console.error("Error updating KYC status:", error.message);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(
                '/api/admin/delete-user',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId }),
                }
            );

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Deletion failed');

            // Remove user from local state immediately
            setProfiles(prev => prev.filter(p => p.id !== userId));
            showToast('User account deleted successfully.', 'success');
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Failed to delete user:', err.message);
            showToast(`Failed to delete user: ${err.message}`, 'error');
        }
    };

    const handleAdjustBalance = async (userId: string, amount: number) => {
        try {
            // Get the user's primary account
            const { data: account } = await supabase
                .from('accounts')
                .select('id, balance')
                .eq('user_id', userId)
                .single();

            if (!account) throw new Error('User account not found');

            const newBalance = Number(account.balance) + amount;
            
            // Update balance
            const { error: updateError } = await supabase
                .from('accounts')
                .update({ balance: newBalance })
                .eq('id', account.id);

            if (updateError) throw updateError;

            // Record adjustment as a transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: userId,
                    amount: Math.abs(amount),
                    type: amount > 0 ? 'deposit' : 'withdrawal',
                    status: 'completed',
                    account_id: account.id
                });

            if (txError) throw txError;

            showToast(`Balance adjusted successfully by $${amount}`, 'success');
            fetchData(); // Refresh everything
        } catch (error: unknown) {
            const err = error as Error;
            showToast(`Adjustment failed: ${err.message}`, 'error');
        }
    };

    const handleToggleRole = async (userId: string, currentRole: string) => {
        try {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;
            showToast(`Role updated to ${newRole}`, 'success');
            fetchData();
        } catch (error: unknown) {
            const err = error as Error;
            showToast(`Role update failed: ${err.message}`, 'error');
        }
    };

    const handleWithdrawAction = async (txId: string, status: 'completed' | 'failed') => {
        try {
            // If status is failed, we need to refund the amount to the user's account
            if (status === 'failed') {
                const { data: tx, error: fetchError } = await supabase
                    .from('transactions')
                    .select('user_id, amount, account_id')
                    .eq('id', txId)
                    .single();

                if (fetchError) throw fetchError;

                if (tx && tx.amount < 0) {
                    // Find the account to refund
                    let accountId = tx.account_id;

                    if (!accountId) {
                        // Fallback: get the first account for the user
                        const { data: acc } = await supabase.from('accounts').select('id').eq('user_id', tx.user_id).limit(1).single();
                        if (acc) accountId = acc.id;
                    }

                    if (accountId) {
                        const { data: account, error: accError } = await supabase.from('accounts').select('balance').eq('id', accountId).single();
                        if (accError) throw accError;

                        const newBalance = Number(account.balance) + Math.abs(tx.amount);
                        const { error: updateAccError } = await supabase.from('accounts').update({ balance: newBalance }).eq('id', accountId);
                        if (updateAccError) throw updateAccError;
                    }
                }
            }

            const { error: updateTxError } = await supabase.from('transactions').update({ status }).eq('id', txId);
            if (updateTxError) throw updateTxError;

        } catch (error: unknown) {
            const err = error as Error;
            console.error("Withdrawal action failed:", err.message);
        }
    };

    if (isLoading) return <div className={styles.loading}>Loading Admin Portal...</div>;

    if (isAdmin === false) {
        return (
            <main className={styles.deniedMain}>
                <Card variant="glass" className={styles.deniedCard}>
                    <h1 className={styles.deniedTitle}>Access Denies</h1>
                    <p className={styles.deniedText}>Admin privileges required.</p>
                    <Button onClick={() => window.location.href = '/'}>Return Home</Button>
                </Card>
            </main>
        );
    }

    const pendingKyc = profiles.filter(p => p.kyc_status === 'pending');
    const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');

    return (
        <main className={styles.main}>
            <Header />
            <div className={styles.container}>
                <div className={styles.adminHeader}>
                    <div>
                        <h1 className={styles.title}>Admin Control Center</h1>
                        <p className={styles.subtitle}>Manage users, security, and global operations</p>
                    </div>
                    <div className={styles.statsRow}>
                        <div className={styles.miniStat}>
                            <span className={styles.label}>TOTAL USERS</span>
                            <span className={styles.value}>{stats.totalUsers}</span>
                        </div>
                        <div className={styles.miniStat}>
                            <span className={styles.label}>TOTAL DEPOSITS</span>
                            <span className={styles.value}>${stats.totalDeposited.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <nav className={styles.tabs}>
                    <button className={activeTab === 'overview' ? styles.activeTab : ''} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={activeTab === 'users' ? styles.activeTab : ''} onClick={() => setActiveTab('users')}>Users</button>
                    <button className={activeTab === 'kyc' ? styles.activeTab : ''} onClick={() => setActiveTab('kyc')}>KYC {stats.pendingKyc > 0 && <span className={styles.notif}>{stats.pendingKyc}</span>}</button>
                    <button className={activeTab === 'withdrawals' ? styles.activeTab : ''} onClick={() => setActiveTab('withdrawals')}>Withdrawals {stats.pendingWithdrawals > 0 && <span className={styles.notif}>{stats.pendingWithdrawals}</span>}</button>
                </nav>

                {activeTab === 'overview' && (
                    <div className={styles.grid}>
                        <Card variant="glass" className={styles.statCard}>
                            <h3>Pending Verification</h3>
                            <div className={styles.bigValue}>{stats.pendingKyc}</div>
                            <Button variant="glass" size="sm" onClick={() => setActiveTab('kyc')}>View Requests</Button>
                        </Card>
                        <Card variant="glass" className={styles.statCard}>
                            <h3>Pending Withdrawals</h3>
                            <div className={styles.bigValue}>{stats.pendingWithdrawals}</div>
                            <Button variant="glass" size="sm" onClick={() => setActiveTab('withdrawals')}>Review Payouts</Button>
                        </Card>
                        <Card variant="glass" className={styles.statCard}>
                            <h3>New Users (24h)</h3>
                            <div className={styles.bigValue}>{profiles.filter(p => new Date(p.created_at) > new Date(Date.now() - 86400000)).length}</div>
                            <Button variant="glass" size="sm" onClick={() => setActiveTab('users')}>Browse Users</Button>
                        </Card>
                    </div>
                )}

                {activeTab === 'users' && (
                    <Card variant="glass">
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>KYC</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profiles.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className={styles.userInfo}>
                                                <span className={styles.userName}>{p.full_name}</span>
                                                <span className={styles.userEmail}>{p.id.substring(0, 8)}...</span>
                                            </div>
                                        </td>
                                        <td><span className={styles.badge}>{p.role}</span></td>
                                        <td>
                                            <span className={`${styles.statusDot} ${styles[p.kyc_status]}`}></span>
                                            {p.kyc_status}
                                        </td>
                                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div className={styles.actionRow}>
                                                <Button 
                                                    size="sm" 
                                                    variant="glass"
                                                    onClick={() => {
                                                        const amt = prompt("Enter adjustment amount (e.g. 500 or -500):");
                                                        if (amt) handleAdjustBalance(p.id, parseFloat(amt));
                                                    }}
                                                >
                                                    💰 Balance
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="glass"
                                                    onClick={() => handleToggleRole(p.id, p.role)}
                                                >
                                                    🔑 Role
                                                </Button>
                                                {p.role !== 'admin' && (
                                                    <Button
                                                        size="sm"
                                                        variant="glass"
                                                        className={styles.rejectBtn}
                                                        onClick={() => setModalConfig({
                                                            isOpen: true,
                                                            title: 'Delete User Account',
                                                            message: `Are you sure you want to permanently delete ${p.full_name}'s account? This will remove all their trades, transactions, and data. This action cannot be undone.`,
                                                            variant: 'danger',
                                                            confirmLabel: 'Delete User',
                                                            onConfirm: () => handleDeleteUser(p.id)
                                                        })}
                                                    >
                                                        🗑 Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}

                {activeTab === 'kyc' && (
                    <Card variant="glass">
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Documents</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingKyc.length === 0 ? (
                                    <tr><td colSpan={4} className={styles.empty}>No pending verifications.</td></tr>
                                ) : (
                                    pendingKyc.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.full_name}</td>
                                            <td>
                                                <div className={styles.docRow}>
                                                    <Button 
                                                        size="sm" 
                                                        variant="glass" 
                                                        onClick={() => setPreviewDoc({ 
                                                            isOpen: true, 
                                                            url: p.id_doc_url || '', 
                                                            title: `ID: ${p.full_name}` 
                                                        })}
                                                    >
                                                        View ID
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="glass" 
                                                        onClick={() => setPreviewDoc({ 
                                                            isOpen: true, 
                                                            url: p.address_doc_url || '', 
                                                            title: `Address: ${p.full_name}` 
                                                        })}
                                                    >
                                                        View Address
                                                    </Button>
                                                </div>
                                            </td>
                                            <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className={styles.actionRow}>
                                                    <Button size="sm" onClick={() => handleKycAction(p.id, 'verified')}>Approve</Button>
                                                    <Button size="sm" variant="glass" className={styles.rejectBtn} onClick={() => {
                                                        setModalConfig({
                                                            isOpen: true,
                                                            title: "Reject KYC Application",
                                                            message: `Are you sure you want to reject the KYC verification for ${p.full_name}? The user will need to resubmit documents.`,
                                                            variant: 'danger',
                                                            confirmLabel: "Reject KYC",
                                                            onConfirm: () => handleKycAction(p.id, 'rejected')
                                                        });
                                                    }}>Reject</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                )}

                {activeTab === 'withdrawals' && (
                    <Card variant="glass">
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingWithdrawals.length === 0 ? (
                                    <tr><td colSpan={4} className={styles.empty}>No pending withdrawal requests.</td></tr>
                                ) : (
                                    pendingWithdrawals.map(w => (
                                        <tr key={w.id}>
                                            <td>{w.profiles?.full_name || 'Unknown'}</td>
                                            <td className={styles.amountOut}>-${Math.abs(w.amount).toLocaleString()}</td>
                                            <td>{new Date(w.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className={styles.actionRow}>
                                                    <Button size="sm" onClick={() => {
                                                        setModalConfig({
                                                            isOpen: true,
                                                            title: "Confirm Payout",
                                                            message: `Have you processed the bank transfer of $${Math.abs(w.amount).toLocaleString()} for ${w.profiles?.full_name}? This will mark the transaction as complete.`,
                                                            variant: 'warning',
                                                            confirmLabel: "Confirm Payout",
                                                            onConfirm: () => handleWithdrawAction(w.id, 'completed')
                                                        });
                                                    }}>Confirm Payout</Button>
                                                    <Button size="sm" variant="glass" className={styles.rejectBtn} onClick={() => {
                                                        setModalConfig({
                                                            isOpen: true,
                                                            title: "Deny Withdrawal",
                                                            message: `Are you sure you want to deny this withdrawal request for ${w.profiles?.full_name}? The funds will be automatically credited back to the user's balance.`,
                                                            variant: 'danger',
                                                            confirmLabel: "Deny Request",
                                                            onConfirm: () => handleWithdrawAction(w.id, 'failed')
                                                        });
                                                    }}>Deny</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                )}
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={() => {
                    modalConfig.onConfirm();
                    setModalConfig({ ...modalConfig, isOpen: false });
                }}
                title={modalConfig.title}
                message={modalConfig.message}
                variant={modalConfig.variant}
                confirmLabel={modalConfig.confirmLabel}
            />

            {previewDoc.isOpen && (
                <div className={styles.docModalOverlay} onClick={() => setPreviewDoc({ ...previewDoc, isOpen: false })}>
                    <div className={styles.docModalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.docModalHeader}>
                            <h3>{previewDoc.title}</h3>
                            <button className={styles.closeDocBtn} onClick={() => setPreviewDoc({ ...previewDoc, isOpen: false })}>×</button>
                        </div>
                        <div className={styles.docModalBody}>
                            {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={previewDoc.url} className={styles.previewIframe} />
                            ) : (
                                <img src={previewDoc.url} alt="Document Preview" className={styles.previewImage} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
