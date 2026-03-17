"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useNotification } from "@/components/ui/NotificationProvider";
import styles from "../page.module.css";

export default function SettingsPage() {
    const supabase = createClient();
    const { showToast } = useNotification();
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        }
        fetchUser();
    }, [supabase]);

    const handleSave = async () => {
        setIsLoading(true);
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsEditing(false);
        setIsLoading(false);
        showToast("Settings updated successfully.", "success");
    };

    return (
        <div className={styles.dashboard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Account Settings</h2>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <Card variant="bordered" className={styles.settingsCard}>
                    <h3 style={{ marginBottom: '1rem' }}>Profile Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    defaultValue={user?.user_metadata?.full_name || 'Trader'}
                                    className={styles.settingsInput}
                                />
                            ) : (
                                <p>{user?.user_metadata?.full_name || 'Trader'}</p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Email</label>
                            <p>{user?.email || 'trader@example.com'}</p>
                        </div>
                    </div>
                </Card>

                <Card variant="bordered" className={styles.settingsCard}>
                    <h3 style={{ marginBottom: '1rem' }}>Security</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Two-Factor Authentication is currently <strong style={{ color: '#ef4444' }}>Disabled</strong>.
                    </p>
                    <Button variant="glass" size="sm">Enable 2FA</Button>
                </Card>

                <Card variant="bordered" className={styles.settingsCard}>
                    <h3 style={{ marginBottom: '1rem' }}>Preferences</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Base Currency</label>
                            <p>USD</p>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Language</label>
                            <p>English</p>
                        </div>
                    </div>
                </Card>
            </div>

            {isEditing && (
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="primary" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
        </div>
    );
}
