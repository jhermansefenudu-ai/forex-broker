import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'glass' | 'bordered';
    className?: string;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    className = ''
}) => {
    return (
        <div className={`${styles.card} ${styles[variant]} ${className}`}>
            {children}
        </div>
    );
};
