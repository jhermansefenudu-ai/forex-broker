"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { MotionWrapper } from "@/components/ui/MotionWrapper";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useNotification } from "@/components/ui/NotificationProvider";
import styles from "./page.module.css";

export default function AccountTypes() {
    const supabase = createClient();
    const router = useRouter();
    const { showToast } = useNotification();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        }
        getUser();
    }, [supabase]);

    const handleOpenAccount = async (type: 'standard' | 'ecn') => {
        if (!user) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        try {
            // Check if user already has an account record
            const { data: existingAccount } = await supabase
                .from('accounts')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (existingAccount) {
                const { error } = await supabase
                    .from('accounts')
                    .update({ type })
                    .eq('id', existingAccount.id);

                if (error) throw error;
            } else {
                // Should be created by DB trigger, but fallback:
                const { error } = await supabase
                    .from('accounts')
                    .insert({
                        user_id: user.id,
                        type,
                        account_number: `ACC-${user.id.substring(0, 8)}`,
                        balance: 1000.00
                    });
                if (error) throw error;
            }

            showToast(`Successfully switched to ${type.toUpperCase()} account!`, 'success');
            router.push('/dashboard');
        } catch (error) {
            console.error("Account error:", error);
            showToast("Failed to update account type. Please try again.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={styles.main}>

            <section className={styles.hero}>
                <div className="container">
                    <MotionWrapper direction="down">
                        <h1 className={styles.title}>Trading Accounts</h1>
                    </MotionWrapper>
                    <MotionWrapper direction="up" delay={0.2}>
                        <p className={styles.subtitle}>
                            Choose the execution model that fits your strategy. From raw ECN spreads to commission-free Standard accounts.
                        </p>
                    </MotionWrapper>
                </div>
            </section>

            <section className={styles.comparison}>
                <div className="container">
                    <MotionWrapper direction="up" delay={0.4}>
                        <div className={`glass-card ${styles.tableContainer}`}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Feature</th>
                                        <th>Standard</th>
                                        <th className={styles.highlight}>ECN Prime</th>
                                        <th>VIP Institutional</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Minimum Deposit</td>
                                        <td>$100</td>
                                        <td className={styles.highlight}>$500</td>
                                        <td>$20,000</td>
                                    </tr>
                                    <tr>
                                        <td>Spreads From</td>
                                        <td>1.0 pips</td>
                                        <td className={styles.highlight}>0.0 pips</td>
                                        <td>0.0 pips</td>
                                    </tr>
                                    <tr>
                                        <td>Commission</td>
                                        <td>None</td>
                                        <td className={styles.highlight}>$3.50 per lot</td>
                                        <td>$2.00 per lot</td>
                                    </tr>
                                    <tr>
                                        <td>Execution</td>
                                        <td>STP</td>
                                        <td className={styles.highlight}>true ECN</td>
                                        <td>true ECN</td>
                                    </tr>
                                    <tr>
                                        <td>Leverage</td>
                                        <td>Up to 1:500</td>
                                        <td className={styles.highlight}>Up to 1:500</td>
                                        <td>Up to 1:200</td>
                                    </tr>
                                    <tr>
                                        <td>Islamic Option</td>
                                        <td>Available</td>
                                        <td className={styles.highlight}>Available</td>
                                        <td>Available</td>
                                    </tr>
                                    <tr className={styles.actionRow}>
                                        <td></td>
                                        <td>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                fullWidth
                                                disabled={isLoading}
                                                onClick={() => handleOpenAccount('standard')}
                                            >
                                                Open Standard
                                            </Button>
                                        </td>
                                        <td className={styles.highlight}>
                                            <Button
                                                variant="primary"
                                                size="md"
                                                fullWidth
                                                disabled={isLoading}
                                                onClick={() => handleOpenAccount('ecn')}
                                            >
                                                Open ECN
                                            </Button>
                                        </td>
                                        <td><Button variant="outline" size="sm" fullWidth>Contact Sales</Button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </MotionWrapper>
                </div>
            </section>
        </main>
    );
}
