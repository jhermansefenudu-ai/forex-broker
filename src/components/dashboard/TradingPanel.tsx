"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import styles from "./TradingPanel.module.css";

interface TradingPanelProps {
    symbol: string;
    currentPrice: number;
    onExecute: (
        type: 'buy' | 'sell',
        size: number,
        orderType: 'market' | 'limit',
        advanced?: {
            limitPrice?: number;
            stopLoss?: number;
            takeProfit?: number;
        }
    ) => Promise<void>;
    isLoading?: boolean;
}

export function TradingPanel({ symbol, currentPrice, onExecute, isLoading }: TradingPanelProps) {
    const [size, setSize] = useState(0.01);
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [limitPrice, setLimitPrice] = useState<string>('');
    const [stopLoss, setStopLoss] = useState<string>('');
    const [takeProfit, setTakeProfit] = useState<string>('');
    const [isAdvancedVisible, setIsAdvancedVisible] = useState(false);

    const handleExecute = (type: 'buy' | 'sell') => {
        onExecute(type, size, orderType, {
            limitPrice: orderType === 'limit' ? Number(limitPrice) : undefined,
            stopLoss: stopLoss ? Number(stopLoss) : undefined,
            takeProfit: takeProfit ? Number(takeProfit) : undefined,
        });
    };

    const isJPY = symbol.includes('JPY');
    const step = isJPY ? 0.001 : 0.00001;

    return (
        <Card variant="glass" className={styles.panel}>
            <div className={styles.header}>
                <div className={styles.symbolInfo}>
                    <h3 className={styles.symbol}>{symbol}</h3>
                    <div className={styles.orderTypeTabs}>
                        <button
                            className={`${styles.tab} ${orderType === 'market' ? styles.activeTab : ''}`}
                            onClick={() => setOrderType('market')}
                        >
                            Market
                        </button>
                        <button
                            className={`${styles.tab} ${orderType === 'limit' ? styles.activeTab : ''}`}
                            onClick={() => setOrderType('limit')}
                        >
                            Limit
                        </button>
                    </div>
                </div>
                <div className={styles.priceContainer}>
                    <div className={styles.priceLabel}>Current Price</div>
                    <div className={styles.price}>{currentPrice.toFixed(isJPY ? 3 : 5)}</div>
                </div>
            </div>

            <div className={styles.mainInputs}>
                <div className={styles.inputGroup}>
                    <label>Lot Size</label>
                    <div className={styles.sizeSelector}>
                        <button onClick={() => setSize(Math.max(0.01, size - 0.01))} disabled={isLoading} aria-label="Decrease lot size">-</button>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
                            disabled={isLoading}
                            aria-label="Lot size"
                        />
                        <button onClick={() => setSize(size + 0.01)} disabled={isLoading} aria-label="Increase lot size">+</button>
                    </div>
                </div>

                {orderType === 'limit' && (
                    <div className={styles.inputGroup}>
                        <label>Limit Price</label>
                        <input
                            type="number"
                            step={step}
                            placeholder={currentPrice.toFixed(isJPY ? 3 : 5)}
                            className={styles.advancedInput}
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                )}
            </div>

            <div className={styles.advancedToggle} onClick={() => setIsAdvancedVisible(!isAdvancedVisible)}>
                {isAdvancedVisible ? 'Hide SL/TP ↑' : 'Advanced Options (SL/TP) ↓'}
            </div>

            {isAdvancedVisible && (
                <div className={styles.advancedGrid}>
                    <div className={styles.inputGroup}>
                        <label>Stop Loss</label>
                        <input
                            type="number"
                            step={step}
                            placeholder="Optional"
                            className={styles.advancedInput}
                            value={stopLoss}
                            onChange={(e) => setStopLoss(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Take Profit</label>
                        <input
                            type="number"
                            step={step}
                            placeholder="Optional"
                            className={styles.advancedInput}
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            )}

            <div className={styles.actions}>
                <Button
                    variant="primary"
                    className={styles.sellBtn}
                    onClick={() => handleExecute('sell')}
                    disabled={isLoading}
                >
                    <span className={styles.btnAction}>SELL</span>
                    <span className={styles.btnPrice}>{(currentPrice - step * 2).toFixed(isJPY ? 3 : 5)}</span>
                </Button>
                <Button
                    variant="primary"
                    className={styles.buyBtn}
                    onClick={() => handleExecute('buy')}
                    disabled={isLoading}
                >
                    <span className={styles.btnAction}>BUY</span>
                    <span className={styles.btnPrice}>{(currentPrice + step * 2).toFixed(isJPY ? 3 : 5)}</span>
                </Button>
            </div>

            <div className={styles.marginNote}>
                Est. Margin: ${(size * 1000).toFixed(2)} USD
            </div>
        </Card>
    );
}
