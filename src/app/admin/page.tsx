"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase";
import styles from "./page.module.css";

interface Profile {
    id: string;
    full_name: string;
    role: 'user' | 'admin';
    kyc_status: 'not_started' | 'pending' | 'verified' | 'rejected';
    id_doc_url?: string;
    address_doc_url?: string;
}

interface WithdrawalRequest {
    id: string;
    user_id: string;
    amount: number;
    description: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    profiles?: { full_name: string };
}

export default function AdminDashboard() {
    const supabase = createClient();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Check if user is admin
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
                .select('*');

            if (profileData) setProfiles(profileData);

            // Fetch pending withdrawals with user names
            const { data: withdrawData } = await supabase
                .from('transactions')
                .select('*, profiles(full_name)')
                .eq('type', 'withdrawal')
                .eq('status', 'pending');

            if (withdrawData) {
                setWithdrawals(withdrawData as unknown as WithdrawalRequest[]);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleKycAction = async (userId: string, status: 'verified' | 'rejected') => {
        const { error } = await supabase.from('profiles').update({ kyc_status: status }).eq('id', userId);
        if (error) {
            alert("Error updating KYC status: " + error.message);
        } else {
            fetchData();
        }
    };

    const handleWithdrawAction = async (txId: string, status: 'completed' | 'failed') => {
        const { error } = await supabase.from('transactions').update({ status }).eq('id', txId);
        if (error) {
            alert("Error updating withdrawal: " + error.message);
        } else {
            fetchData();
        }
    };

    if (isLoading) return <div className={styles.loading}>Loading Admin Portal...</div>;

    if (isAdmin === false) {
        return (
            <main style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Card variant="glass" style={{ padding: '2rem', textAlign: 'center' }}>
                    <h1 style={{ color: '#ef4444' }}>Access Denied</h1>
                    <p style={{ color: '#94a3b8', margin: '1rem 0' }}>You do not have administrative privileges to access this page.</p>
                    <Button onClick={() => window.location.href = '/'}>Return Home</Button>
                </Card>
            </main>
        );
    }

    const pendingKyc = profiles.filter(p => p.kyc_status === 'pending');

    return (
        <main style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <Header />
            <div className={styles.container}>
                <h1 className={styles.title}>Admin Control Center</h1>

                <section className={styles.section}>
                    <h2>Pending KYC Verifications <span className={styles.badge}>{pendingKyc.length}</span></h2>
                    <Card variant="glass">
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Documents</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingKyc.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>No pending verifications.</td></tr>
                                ) : (
                                    pendingKyc.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.full_name}</td>
                                            <td><span className={styles.badge}>{p.kyc_status}</span></td>
                                            <td>
                                                <div className={styles.actionCell}>
                                                    <a href={p.id_doc_url} target="_blank" className={styles.docLink}>ID Doc</a>
                                                    <a href={p.address_doc_url} target="_blank" className={styles.docLink}>Address Doc</a>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.actionCell}>
                                                    <Button size="sm" onClick={() => handleKycAction(p.id, 'verified')}>Approve</Button>
                                                    <Button size="sm" variant="glass" onClick={() => handleKycAction(p.id, 'rejected')}>Reject</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                </section>

                <section className={styles.section}>
                    <h2>Pending Withdrawals <span className={styles.badge}>{withdrawals.length}</span></h2>
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
                                {withdrawals.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>No pending withdrawal requests.</td></tr>
                                ) : (
                                    withdrawals.map(w => (
                                        <tr key={w.id}>
                                            <td>{w.profiles?.full_name || 'Unknown'}</td>
                                            <td style={{ color: '#ef4444' }}>${Math.abs(w.amount).toLocaleString()}</td>
                                            <td>{new Date(w.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className={styles.actionCell}>
                                                    <Button size="sm" onClick={() => handleWithdrawAction(w.id, 'completed')}>Approve</Button>
                                                    <Button size="sm" variant="glass" onClick={() => handleWithdrawAction(w.id, 'failed')}>Reject</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                </section>
            </div>
        </main>
    );
}
