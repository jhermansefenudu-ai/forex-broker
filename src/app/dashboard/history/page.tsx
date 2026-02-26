"use client";

import React, { useEffect, useState } from 'react';
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

    if (isLoading) return <div className={styles.loading}>Loading history...</div>;

    return (
        <div className={styles.dashboard}>
            <h2 className={styles.sectionTitle}>Trade History</h2>
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
