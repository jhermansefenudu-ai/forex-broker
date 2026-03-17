"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRealtime } from '@/hooks/useRealtime';
import { useNotification } from '@/components/ui/NotificationProvider';
import styles from './Header.module.css';

export const Header: React.FC = () => {
    const supabase = createClient();
    const router = useRouter();
    const { showToast } = useNotification();
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'user' | 'admin'>('user');


    useRealtime(user?.id, (payload) => {
        if (payload.type === 'profile') {
            const status = payload.data.kyc_status;
            if (status === 'verified') {
                showToast("Your account has been verified!", 'success');
            } else if (status === 'rejected') {
                showToast("Your KYC verification was rejected. Please check your documents.", 'error');
            }
        } else if (payload.type === 'transaction') {
            const status = payload.data.status;
            const amount = Math.abs(payload.data.amount);
            if (status === 'completed') {
                showToast(`Your withdrawal of $${amount.toLocaleString()} was approved.`, 'success');
            } else if (status === 'failed') {
                showToast(`Your withdrawal of $${amount.toLocaleString()} failed.`, 'error');
            }
        }
    });

    useEffect(() => {
        async function getSession() {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                if (data) setRole(data.role);
            }
        }
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                if (data) setRole(data.role);
            } else {
                setRole('user');
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <header className={styles.header}>
            <div className="container">
                <nav className={styles.nav}>
                    <Link href="/" className={styles.logo}>
                        PrimeTrade FX
                    </Link>

                    <ul className={styles.navLinks}>
                        <li><Link href="#markets">Markets</Link></li>
                        <li><Link href="/accounts">Accounts</Link></li>
                        <li><Link href="#platforms">Platforms</Link></li>
                        <li><Link href="#education">Education</Link></li>
                    </ul>

                    <div className={styles.authButtons}>
                        {user ? (
                            <>
                                {role === 'admin' && (
                                    <Link href="/admin">
                                        <Button variant="glass" size="sm">Admin</Button>
                                    </Link>
                                )}
                                <Link href="/dashboard">
                                    <Button variant="outline" size="sm">Dashboard</Button>
                                </Link>
                                <Button variant="primary" size="sm" onClick={handleSignOut}>Sign Out</Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="outline" size="sm">Login</Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="primary" size="sm">Open Account</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
};
