"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMarketData, MarketTick } from "@/hooks/useMarketData";
import { TradingPanel } from "@/components/dashboard/TradingPanel";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import styles from "./page.module.css";

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'trade';
    description: string;
    amount: number;
    status: string;
    created_at: string;
}

interface UserAccount {
    id: string;
    type: string;
    balance: number;
}

interface Trade {
    id: string;
    symbol: string;
    type: 'buy' | 'sell';
    size: number;
    entry_price: number;
    status: 'open' | 'closed';
    pnl: number;
    created_at: string;
}

export default function Dashboard() {
    const { prices } = useMarketData(['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD']);
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [accounts, setAccounts] = useState<UserAccount[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [userName, setUserName] = useState('');
    const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
    const [isExecuting, setIsExecuting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserName(user.user_metadata?.full_name || 'Trader');

            // Fetch accounts
            const { data: accData } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user.id);

            if (accData) setAccounts(accData);

            // Fetch transactions
            const { data: transData } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (transData) setTransactions(transData);

            // Fetch open trades
            const { data: tradeData } = await supabase
                .from('trades')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'open');

            if (tradeData) setTrades(tradeData as Trade[]);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExecuteTrade = async (type: 'buy' | 'sell', size: number) => {
        setIsExecuting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || accounts.length === 0) return;

            const entryPrice = prices[selectedSymbol]?.price || 0;

            const { error } = await supabase
                .from('trades')
                .insert({
                    user_id: user.id,
                    account_id: accounts[0].id,
                    symbol: selectedSymbol,
                    type,
                    size,
                    entry_price: entryPrice,
                    status: 'open'
                });

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Execution error:', error);
            alert('Failed to execute trade. Please try again.');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleCloseTrade = async (tradeId: string, symbol: string, type: 'buy' | 'sell', size: number, entryPrice: number) => {
        setIsExecuting(true);
        try {
            const currentPrice = prices[symbol]?.price || entryPrice;
            const pnl = type === 'buy'
                ? (currentPrice - entryPrice) * size * 100000
                : (entryPrice - currentPrice) * size * 100000;

            const { error: tradeError } = await supabase
                .from('trades')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString(),
                    close_price: currentPrice,
                    pnl: pnl
                })
                .eq('id', tradeId);

            if (tradeError) throw tradeError;

            const newBalance = Number(accounts[0].balance) + pnl;
            const { error: accError } = await supabase
                .from('accounts')
                .update({ balance: newBalance })
                .eq('id', accounts[0].id);

            if (accError) throw accError;

            await supabase.from('transactions').insert({
                user_id: (await supabase.auth.getUser()).data.user?.id,
                type: 'trade',
                description: `Trade Profit/Loss: ${symbol} ${type.toUpperCase()}`,
                amount: pnl,
                status: 'completed'
            });

            fetchData();
        } catch (error) {
            console.error('Closing error:', error);
            alert('Failed to close trade.');
        } finally {
            setIsExecuting(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loading}>Loading Dashboard...</div>
            </div>
        );
    }

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const mainAccount = accounts[0] || { balance: 0 };

    const openPnL = trades.reduce((sum, trade) => {
        const currentPrice = prices[trade.symbol]?.price || trade.entry_price;
        const pnl = trade.type === 'buy'
            ? (currentPrice - trade.entry_price) * trade.size * 100000
            : (trade.entry_price - currentPrice) * trade.size * 100000;
        return sum + pnl;
    }, 0);

    const equity = Number(mainAccount.balance) + openPnL;

    return (
        <div className={styles.dashboard}>
            <section className={styles.statsGrid}>
                <Card variant="glass" className={styles.balanceCard}>
                    <div className={styles.cardLabel}>Total Balance</div>
                    <div className={styles.cardValue}>${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className={styles.cardChange}>Welcome back, {userName}</div>
                </Card>

                <Card variant="glass">
                    <div className={styles.cardLabel}>Equity</div>
                    <div className={styles.cardValue}>${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className={styles.cardSub}>Margin Level: 0%</div>
                </Card>

                <Card variant="glass">
                    <div className={styles.cardLabel}>Active Trades</div>
                    <div className={styles.cardValue}>{trades.length}</div>
                    <div className={styles.cardSub}>Total PnL: <span className={openPnL >= 0 ? styles.positive : styles.negative}>
                        {openPnL >= 0 ? '+' : ''}${openPnL.toFixed(2)}
                    </span></div>
                </Card>
            </section>

            <div className={styles.tradingSection}>
                <section className={styles.tradingView}>
                    <h2 className={styles.sectionTitle}>Execution</h2>
                    <TradingPanel
                        symbol={selectedSymbol}
                        currentPrice={prices[selectedSymbol]?.price || 0}
                        onExecute={handleExecuteTrade}
                        isLoading={isExecuting}
                    />
                </section>

                <section className={styles.marketWatch}>
                    <h2 className={styles.sectionTitle}>Market Watch</h2>
                    <Card variant="glass" className={styles.marketWrapper}>
                        {Object.values(prices).map((tick) => (
                            <div
                                key={tick.symbol}
                                className={`${styles.rowWrapper} ${selectedSymbol === tick.symbol ? styles.selected : ''}`}
                                onClick={() => setSelectedSymbol(tick.symbol)}
                            >
                                <MarketRow tick={tick} />
                            </div>
                        ))}
                    </Card>
                </section>
            </div>

            <div className={styles.contentGrid}>
                <section className={styles.openPositions}>
                    <h2 className={styles.sectionTitle}>Open Positions</h2>
                    <Card variant="default" className={styles.activityTable}>
                        <div className={styles.tableHeader}>
                            <span>Symbol</span>
                            <span>Type</span>
                            <span>Size</span>
                            <span>Entry</span>
                            <span>PnL</span>
                            <span>Action</span>
                        </div>
                        {trades.length === 0 ? (
                            <div className={styles.emptyState}>No open positions.</div>
                        ) : (
                            trades.map((trade) => (
                                <PositionRow
                                    key={trade.id}
                                    trade={trade}
                                    currentPrice={prices[trade.symbol]?.price || 0}
                                    onClose={() => handleCloseTrade(trade.id, trade.symbol, trade.type, trade.size, trade.entry_price)}
                                    isClosing={isExecuting}
                                />
                            ))
                        )}
                    </Card>
                </section>

                <section className={styles.recentActivity}>
                    <h2 className={styles.sectionTitle}>Recent Activity</h2>
                    <Card variant="default" className={styles.activityTable}>
                        <div className={styles.tableHeader}>
                            <span>Date</span>
                            <span>Type</span>
                            <span>Description</span>
                            <span>Amount</span>
                            <span>Status</span>
                        </div>
                        {transactions.length === 0 ? (
                            <div className={styles.emptyState}>No recent transactions found.</div>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className={styles.tableRow}>
                                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                                    <span style={{ textTransform: 'capitalize' }}>{tx.type}</span>
                                    <span>{tx.description}</span>
                                    <span className={tx.amount >= 0 ? styles.positive : styles.negative}>
                                        {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                                    </span>
                                    <span className={styles.badge}>{tx.status}</span>
                                </div>
                            ))
                        )}
                    </Card>
                </section>
            </div>
        </div>
    );
}

function PositionRow({ trade, currentPrice, onClose, isClosing }: {
    trade: Trade,
    currentPrice: number,
    onClose: () => void,
    isClosing: boolean
}) {
    const pnl = trade.type === 'buy'
        ? (currentPrice - trade.entry_price) * trade.size * 100000
        : (trade.entry_price - currentPrice) * trade.size * 100000;

    return (
        <div className={styles.tableRow}>
            <span className={styles.symbol}>{trade.symbol}</span>
            <span style={{ color: trade.type === 'buy' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {trade.type.toUpperCase()}
            </span>
            <span>{trade.size.toFixed(2)}</span>
            <span>{trade.entry_price.toFixed(trade.symbol.includes('JPY') ? 3 : 5)}</span>
            <span className={pnl >= 0 ? styles.positive : styles.negative} style={{ minWidth: '80px' }}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
            </span>
            <Button
                size="sm"
                variant="glass"
                className={styles.closeBtn}
                onClick={onClose}
                disabled={isClosing}
            >
                {isClosing ? '...' : 'Close'}
            </Button>
        </div>
    );
}

function MarketRow({ tick }: { tick: MarketTick }) {
    const [flash, setFlash] = useState<'up' | 'down' | null>(null);
    const prevPriceRef = useRef(tick.price);

    useEffect(() => {
        if (tick.price > prevPriceRef.current) {
            setTimeout(() => setFlash('up'), 0);
            const timer = setTimeout(() => setFlash(null), 500);
            prevPriceRef.current = tick.price;
            return () => clearTimeout(timer);
        } else if (tick.price < prevPriceRef.current) {
            setTimeout(() => setFlash('down'), 0);
            const timer = setTimeout(() => setFlash(null), 500);
            prevPriceRef.current = tick.price;
            return () => clearTimeout(timer);
        }
    }, [tick.price]);

    return (
        <div className={styles.marketRow}>
            <span className={styles.symbol}>{tick.symbol}</span>
            <motion.span
                className={`${styles.price} ${flash ? styles[flash] : ''}`}
                animate={flash ? { scale: [1, 1.05, 1] } : {}}
            >
                {tick.price.toFixed(tick.symbol.includes('JPY') ? 3 : 5)}
            </motion.span>
            <span className={tick.change >= 0 ? styles.positive : styles.negative}>
                {tick.change >= 0 ? '+' : ''}{tick.changePercent.toFixed(2)}%
            </span>
        </div>
    );
}
