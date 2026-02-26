"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import styles from "./layout.module.css";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const supabase = createClient();
    const [userName, setUserName] = useState('Trader');
    const [initials, setInitials] = useState('TR');

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.full_name) {
                setUserName(user.user_metadata.full_name);
                const names = user.user_metadata.full_name.split(' ');
                setInitials(names.map((n: string) => n[0]).join('').toUpperCase().substring(0, 2));
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
                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
        </div>
    );
}
