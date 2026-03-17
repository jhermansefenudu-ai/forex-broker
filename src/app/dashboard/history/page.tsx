"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase";
import styles from "../page.module.css";

interface ClosedTrade {
    id: string;
    symbol: string;
    type: 'buy' | 'sell';
    size: number;
    entry_price: number;
    close_price: number;
    pnl: number;
    closed_at: string;
}

export default function TradeHistory() {
    const supabase = createClient();
    const [trades, setTrades] = useState<ClosedTrade[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('trades')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'closed')
                    .order('closed_at', { ascending: false });

                if (error) throw error;
                setTrades(data || []);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchHistory();
    }, [supabase]);

    const metrics = useMemo(() => {
        if (trades.length === 0) return { winRate: 0, totalPnL: 0, bestTrade: 0 };
        const wins = trades.filter(t => t.pnl > 0).length;
        const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const bestTrade = Math.max(...trades.map(t => t.pnl || 0));
        return {
            winRate: (wins / trades.length) * 100,
            totalPnL,
            bestTrade
        };
    }, [trades]);

    if (isLoading) return <div className={styles.loading}>Loading history...</div>;

    return (
        <div className={styles.dashboard}>
            <div className={styles.headerRow}>
                <h2 className={styles.sectionTitle}>Trade History</h2>
                <div className={styles.historyMetrics}>
                    <div className={styles.metric}>
                        <span className={styles.metricLabel}>Win Rate</span>
                        <span className={`${styles.metricValue} ${metrics.winRate >= 50 ? styles.positive : styles.negative}`}>
                            {metrics.winRate.toFixed(1)}%
                        </span>
                    </div>
                    <div className={styles.metric}>
                        <span className={styles.metricLabel}>Total PnL</span>
                        <span className={`${styles.metricValue} ${metrics.totalPnL >= 0 ? styles.positive : styles.negative}`}>
                            ${metrics.totalPnL.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <Card variant="default" className={styles.activityTable}>
                <div className={styles.tableHeader}>
                    <span>Date</span>
                    <span>Symbol</span>
                    <span>Type</span>
                    <span>Entry / Close</span>
                    <span>PnL</span>
                </div>
                {trades.length === 0 ? (
                    <div className={styles.emptyState}>No closed trades found.</div>
                ) : (
                    trades.map((trade) => (
                        <div key={trade.id} className={styles.tableRow}>
                            <span>{new Date(trade.closed_at).toLocaleDateString()}</span>
                            <span className={styles.symbol}>{trade.symbol}</span>
                            <span style={{ color: trade.type === 'buy' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                {trade.type.toUpperCase()}
                            </span>
                            <span>{trade.entry_price.toFixed(5)} / {trade.close_price?.toFixed(5)}</span>
                            <span className={trade.pnl >= 0 ? styles.positive : styles.negative}>
                                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </span>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}
