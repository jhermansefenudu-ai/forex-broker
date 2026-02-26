"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import styles from "../page.module.css";

export default function WithdrawPage() {
    const supabase = createClient();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bank');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleWithdraw = async () => {
        if (!amount || Number(amount) < 50) {
            alert("Please enter an amount of at least $50.");
            return;
        }

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Simulate withdrawal request
            const { error } = await supabase.from('transactions').insert({
                user_id: user.id,
                type: 'withdrawal',
                description: `Withdrawal request via ${method === 'bank' ? 'Bank Wire' : method.toUpperCase()}`,
                amount: -Number(amount),
                status: 'pending'
            });

            if (error) throw error;
            setSuccess(true);
        } catch (error) {
            console.error('Withdrawal error:', error);
            alert("Failed to submit withdrawal request.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.dashboard}>
                <Card variant="glass" className={styles.tradingPanel}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h2>Withdrawal Requested</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '1rem 0' }}>
                            Your request for ${Number(amount).toLocaleString()} is being processed.
                        </p>
                        <Button variant="outline" onClick={() => { setSuccess(false); setAmount(''); }}>
                            Done
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }
    return (
        <div className={styles.dashboard}>
            <h2 className={styles.sectionTitle}>Withdraw Funds</h2>
            <Card variant="glass" className={`${styles.tradingPanel} ${styles.withdrawLimit}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
                    <div className={styles.inputGroup}>
                        <label>Withdrawal Method</label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                padding: '0.75rem',
                                borderRadius: '8px'
                            }}
                        >
                            <option value="bank">Bank Wire</option>
                            <option value="crypto">Cryptocurrency (USDT)</option>
                            <option value="card">Credit/Debit Card</option>
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Amount ($)</label>
                        <input
                            type="number"
                            placeholder="Min: $50"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                padding: '0.75rem',
                                borderRadius: '8px'
                            }}
                        />
                    </div>

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleWithdraw}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Request Withdrawal'}
                    </Button>

                    <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                        Withdrawals are typically processed within 24-48 hours.
                    </p>
                </div>
            </Card>
        </div>
    );
}
