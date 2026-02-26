"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import styles from "./page.module.css";

export default function Deposit() {
    const supabase = createClient();
    const router = useRouter();
    const [selectedMethod, setSelectedMethod] = useState<string | null>('card');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [currentBalance, setCurrentBalance] = useState(0);

    useEffect(() => {
        async function fetchAccount() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('accounts')
                    .select('id, balance')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    setAccountId(data.id);
                    setCurrentBalance(Number(data.balance));
                }
            }
        }
        fetchAccount();
    }, [supabase]);

    const handleDeposit = async () => {
        if (!amount || Number(amount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        if (!accountId) {
            alert("Account not found. Please contact support.");
            return;
        }

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const depositAmount = Number(amount);

            // 1. Create transaction record
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    account_id: accountId,
                    type: 'deposit',
                    amount: depositAmount,
                    description: `Deposit via ${selectedMethod}`,
                    status: 'completed'
                });

            if (txError) throw txError;

            // 2. Update account balance
            const { error: accError } = await supabase
                .from('accounts')
                .update({ balance: currentBalance + depositAmount })
                .eq('id', accountId);

            if (accError) throw accError;

            alert("Deposit successful!");
            router.push("/dashboard");
        } catch (error) {
            console.error("Deposit error:", error);
            alert("Deposit failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const methods = [
        { id: 'card', name: 'Visa / Mastercard', fee: '0%', time: 'Instant' },
        { id: 'crypto', name: 'Bitcoin / USDT', fee: '0.5%', time: '10-30 mins' },
        { id: 'bank', name: 'Bank Transfer', fee: '0%', time: '1-3 Days' },
        { id: 'skrill', name: 'Skrill / Neteller', fee: '1%', time: 'Instant' },
    ];

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Deposit Funds</h1>

            <div className={styles.grid}>
                <section>
                    <h2 className={styles.sectionTitle}>1. Select Payment Method</h2>
                    <div className={styles.methodsGrid}>
                        {methods.map((method) => (
                            <Card
                                key={method.id}
                                className={`${styles.methodCard} ${selectedMethod === method.id ? styles.selected : ''}`}
                                variant="glass"
                            >
                                <div
                                    className={styles.methodClickArea}
                                    onClick={() => setSelectedMethod(method.id)}
                                >
                                    <div className={styles.methodName}>{method.name}</div>
                                    <div className={styles.methodDetails}>
                                        <span>Fee: {method.fee}</span>
                                        <span>Time: {method.time}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className={styles.sectionTitle}>2. Enter Amount</h2>
                    <Card variant="glass" className={styles.amountCard}>
                        <div className={styles.inputWrapper}>
                            <span className={styles.currency}>$</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                className={styles.amountInput}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div className={styles.quickAmounts}>
                            {[100, 500, 1000].map(val => (
                                <button
                                    key={val}
                                    className={styles.quickBtn}
                                    onClick={() => setAmount(val.toString())}
                                >
                                    ${val}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            className={styles.confirmBtn}
                            onClick={handleDeposit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Proceed to Payment'}
                        </Button>
                        <p className={styles.secureNote}>
                            <span className={styles.lockIcon}>🔒</span> 256-bit SSL Secured Payment
                        </p>
                    </Card>
                </section>
            </div>
        </div>
    );
}
