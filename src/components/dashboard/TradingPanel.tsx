"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import styles from "./TradingPanel.module.css";

interface TradingPanelProps {
    symbol: string;
    currentPrice: number;
    onExecute: (type: 'buy' | 'sell', size: number) => Promise<void>;
    isLoading?: boolean;
}

export function TradingPanel({ symbol, currentPrice, onExecute, isLoading }: TradingPanelProps) {
    const [size, setSize] = useState(0.01);

    const handleExecute = (type: 'buy' | 'sell') => {
        onExecute(type, size);
    };

    return (
        <Card variant="glass" className={styles.panel}>
            <div className={styles.header}>
                <h3 className={styles.symbol}>{symbol}</h3>
                <div className={styles.price}>{currentPrice.toFixed(symbol.includes('JPY') ? 3 : 5)}</div>
            </div>

            <div className={styles.inputGroup}>
                <label>Lot Size</label>
                <div className={styles.sizeSelector}>
                    <button onClick={() => setSize(Math.max(0.01, size - 0.01))} disabled={isLoading}>-</button>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        disabled={isLoading}
                    />
                    <button onClick={() => setSize(size + 0.01)} disabled={isLoading}>+</button>
                </div>
            </div>

            <div className={styles.actions}>
                <Button
                    variant="primary"
                    className={styles.sellBtn}
                    onClick={() => handleExecute('sell')}
                    disabled={isLoading}
                >
                    SELL
                </Button>
                <Button
                    variant="primary"
                    className={styles.buyBtn}
                    onClick={() => handleExecute('buy')}
                    disabled={isLoading}
                >
                    BUY
                </Button>
            </div>
        </Card>
    );
}
