"use client";

import React, { useState, useRef } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import styles from "./page.module.css";

export default function KYC() {
    const supabase = createClient();
    const [status, setStatus] = useState<'idle' | 'uploading' | 'submitted'>('idle');
    const [files, setFiles] = useState<{ id?: string; address?: string }>({});
    const [uploadingType, setUploadingType] = useState<'id' | 'address' | null>(null);

    const idInputRef = useRef<HTMLInputElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'address') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingType(type);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('kyc-documents')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(fileName);

            setFiles(prev => ({ ...prev, [type]: publicUrl }));
        } catch (error: unknown) {
            console.error('Upload error:', error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploadingType(null);
        }
    };

    const handleSubmit = async () => {
        if (!files.id || !files.address) {
            alert("Please upload both Proof of Identity and Proof of Address.");
            return;
        }
        setStatus('uploading');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('profiles')
                .update({
                    kyc_status: 'pending',
                    id_doc_url: files.id,
                    address_doc_url: files.address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            setStatus('submitted');
        } catch (error: unknown) {
            console.error('Submission error:', error);
            alert("Submission failed. Please try again.");
            setStatus('idle');
        }
    };

    if (status === 'submitted') {
        return (
            <div className={styles.container}>
                <Card variant="glass" className={styles.successCard}>
                    <div className={styles.successIcon}>✅</div>
                    <h1>Documents Submitted</h1>
                    <p>Your verification documents have been received and are currently under review. This process usually takes 24-48 hours.</p>
                    <Button variant="outline" onClick={() => setStatus('idle')}>Back to Verification</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Account Verification</h1>
            <p className={styles.description}>
                To comply with regulatory requirements, please verify your identity to unlock full trading limits.
            </p>

            <div className={styles.grid}>
                <input
                    type="file"
                    ref={idInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileSelect(e, 'id')}
                />
                <Card variant="glass" className={styles.uploadCard}>
                    <div className={styles.stepBadge}>Step 1</div>
                    <h3>Proof of Identity</h3>
                    <p>Passport, National ID, or Driver&apos;s License</p>

                    <div className={styles.dropzone} onClick={() => idInputRef.current?.click()}>
                        <div className={styles.uploadIcon}>☁️</div>
                        <div className={styles.uploadText}>
                            {uploadingType === 'id' ? (
                                <span>Uploading...</span>
                            ) : files.id ? (
                                <span className={styles.fileName}>ID Document Uploaded</span>
                            ) : (
                                <><span>Click to upload</span> or drag and drop</>
                            )}
                        </div>
                        <div className={styles.supported}>JPG, PNG or PDF (Max 5MB)</div>
                    </div>
                </Card>

                <input
                    type="file"
                    ref={addressInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileSelect(e, 'address')}
                />
                <Card variant="glass" className={styles.uploadCard}>
                    <div className={styles.stepBadge}>Step 2</div>
                    <h3>Proof of Address</h3>
                    <p>Utility Bill or Bank Statement (last 3 months)</p>

                    <div className={styles.dropzone} onClick={() => addressInputRef.current?.click()}>
                        <div className={styles.uploadIcon}>📄</div>
                        <div className={styles.uploadText}>
                            {uploadingType === 'address' ? (
                                <span>Uploading...</span>
                            ) : files.address ? (
                                <span className={styles.fileName}>Address Document Uploaded</span>
                            ) : (
                                <><span>Click to upload</span> or drag and drop</>
                            )}
                        </div>
                        <div className={styles.supported}>JPG, PNG or PDF (Max 5MB)</div>
                    </div>
                </Card>
            </div>

            <div className={styles.actions}>
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={status === 'uploading' || uploadingType !== null}
                >
                    {status === 'uploading' ? 'Submitting...' : 'Submit Documents'}
                </Button>
            </div>
        </div>
    );
}
