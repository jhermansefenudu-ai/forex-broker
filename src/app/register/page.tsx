"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase";
import styles from "./page.module.css";

export default function Register() {
    const supabase = createClient();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                    data: {
                        full_name: `${formData.firstName} ${formData.lastName}`,
                    }
                }
            });

            if (error) throw error;

            // Note: In a real app, we might need to create a profile entry here if triggers aren't set up
            // But adhering to "Simple" first.

            router.push("/dashboard");
            // Or show "Check email for verification" if email confirmation is enabled in Supabase
        } catch (error: unknown) {
            console.error('Registration error:', error);
            let message = "An unexpected error occurred.";

            if (error instanceof Error) {
                message = error.message;
                // Specific check for Supabase Auth rate limits or status codes
                const supabaseError = error as { status?: number; message: string };
                if (supabaseError.status === 429 || supabaseError.message.includes('rate limit')) {
                    message = "Too many registration attempts. Please wait a few minutes and try again.";
                }
            }

            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={styles.main}>
            <Card variant="glass" className={styles.authCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>Join thousands of traders on PrimeTrade FX</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                required
                                placeholder="John"
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                required
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            required
                            placeholder="trader@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="country">Country of Residence</label>
                        <select
                            id="country"
                            required
                            value={formData.country}
                            onChange={handleChange}
                        >
                            <option value="">Select Country</option>
                            <option value="US">United States</option>
                            <option value="UK">United Kingdom</option>
                            <option value="CA">Canada</option>
                            <option value="AU">Australia</option>
                            <option value="DE">Germany</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            required
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.terms}>
                        <input type="checkbox" id="terms" required />
                        <label htmlFor="terms">I agree to the <a href="#">Terms & Conditions</a></label>
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </Button>
                </form>

                <div className={styles.footer}>
                    Already have an account? <Link href="/login">Log in</Link>
                </div>
            </Card>
        </main>
    );
}
