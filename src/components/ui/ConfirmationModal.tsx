"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'info' | 'warning';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    variant = 'info'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.backdrop}
                        onClick={onCancel}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`${styles.modal} ${styles[variant]}`}
                    >
                        <div className={styles.content}>
                            <h3 className={styles.title}>{title}</h3>
                            <p className={styles.message}>{message}</p>
                        </div>
                        <div className={styles.actions}>
                            <Button variant="outline" size="md" onClick={onCancel} className={styles.cancelBtn}>
                                {cancelLabel}
                            </Button>
                            <Button variant="primary" size="md" onClick={onConfirm} className={styles.confirmBtn}>
                                {confirmLabel}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
