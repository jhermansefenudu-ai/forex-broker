"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MotionWrapper } from "@/components/ui/MotionWrapper";
import { createClient } from "@/lib/supabase";
import styles from "./page.module.css";

export default function Login() {
    const supabase = createClient();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Renamed from 'loading' to 'isLoading'
    const [error, setError] = useState<string | null>(null); // Added error state


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            router.push("/dashboard");
            router.refresh(); // Refresh to update session
        } catch (error) {
            console.error('Login error:', error);
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={styles.main}>
            <MotionWrapper direction="up" delay={0.1}>
                <Card variant="glass" className={styles.authCard}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Welcome Back</h1>
                        <p className={styles.subtitle}>Log in to your PrimeTrade FX account</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <p className={styles.errorMessage}>{error}</p>} {/* Display error message */}
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                required
                                placeholder="trader@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className={styles.forgotPassword}>
                            <a href="#">Forgot Password?</a>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>

                    <div className={styles.footer}>
                        Don&apos;t have an account? <Link href="/register">Sign up</Link>
                    </div>
                </Card>
            </MotionWrapper>
        </main>
    );
}
