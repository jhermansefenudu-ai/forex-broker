"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import styles from "./layout.module.css";

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const supabase = createClient();
    const [userName, setUserName] = useState('Trader');
    const [initials, setInitials] = useState('TR');
    const [kycStatus, setKycStatus] = useState<'not_started' | 'pending' | 'verified' | 'rejected'>('not_started');

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (user.user_metadata?.full_name) {
                    setUserName(user.user_metadata.full_name);
                    const names = user.user_metadata.full_name.split(' ');
                    setInitials(names.map((n: string) => n[0]).join('').toUpperCase().substring(0, 2));
                }

                // Fetch profile to get real-time KYC status
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('kyc_status')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setKycStatus(profile.kyc_status);
                }
            }
        }
        getUser();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const navItems = [
        { label: 'Overview', href: '/dashboard' },
        { label: 'Deposit', href: '/dashboard/deposit' },
        { label: 'Withdraw', href: '/dashboard/withdraw' },
        { label: 'History', href: '/dashboard/history' },
        { label: 'Verification (KYC)', href: '/dashboard/kyc' },
        { label: 'Settings', href: '/dashboard/settings' },
    ];

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <Link href="/" className={styles.logo}>PrimeTrade FX</Link>
                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className={styles.logout}>
                    <Button variant="outline" size="sm" fullWidth onClick={handleLogout}>Log Out</Button>
                </div>
            </aside>

            <div className={styles.content}>
                <header className={styles.topbar}>
                    <div className={styles.breadcrumbs}>
                        Dashboard {pathname !== '/dashboard' ? `/ ${pathname.split('/').pop()?.toUpperCase()}` : '/ OVERVIEW'}
                    </div>
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>{initials}</div>
                        <span>{userName}</span>
                    </div>
                </header>

                {kycStatus !== 'verified' && (
                    <div className={`${styles.kycBanner} ${styles[kycStatus]}`}>
                        <div className={styles.kycContent}>
                            <span className={styles.kycIcon}>
                                {kycStatus === 'not_started' && '⚠️'}
                                {kycStatus === 'pending' && '⏳'}
                                {kycStatus === 'rejected' && '❌'}
                            </span>
                            <span className={styles.kycText}>
                                {kycStatus === 'not_started' && 'Your account is not verified. Please complete KYC to unlock withdrawals.'}
                                {kycStatus === 'pending' && 'Verification in progress. Your documents are being reviewed.'}
                                {kycStatus === 'rejected' && 'Verification rejected. Please re-submit your documents.'}
                            </span>
                        </div>
                        {kycStatus !== 'pending' && (
                            <Link href="/dashboard/kyc">
                                <Button size="sm" variant="glass" className={styles.kycBtn}>Verify Now</Button>
                            </Link>
                        )}
                    </div>
                )}

                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
        </div>
    );
}
