"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNotification } from '@/components/ui/NotificationProvider';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TradingPanel } from "@/components/dashboard/TradingPanel";
import { Chart } from "@/components/ui/Chart";
import { createClient } from "@/lib/supabase";
import { CandlestickData, Time } from "lightweight-charts";
import { useMarketData, MarketTick } from "@/hooks/useMarketData";
import styles from "./page.module.css";

interface Trade {
    id: string;
    symbol: string;
    type: 'buy' | 'sell';
    size: number;
    entry_price: number;
    status: 'open' | 'closed' | 'pending';
    created_at: string;
    stop_loss?: number;
    take_profit?: number;
    limit_price?: number;
    pnl?: number;
    closed_at?: string;
    close_price?: number;
}

interface Account {
    id: string;
    user_id: string;
    balance: number;
    currency: string;
    type: string;
    created_at: string;
}

export default function Dashboard() {
    const supabase = createClient();
    const { showToast } = useNotification();
    const [isLoading, setIsLoading] = useState(true);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
    const [timeframe, setTimeframe] = useState('1D');
    const [isExecuting, setIsExecuting] = useState(false);
    const [chartData, setChartData] = useState<CandlestickData[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [isCloseAllModalOpen, setIsCloseAllModalOpen] = useState(false);

    const { prices } = useMarketData(['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD']);

    const generateHistory = useCallback((symbol: string) => {
        const data: CandlestickData[] = [];
        let increment = 86400; // 1D
        if (timeframe === '1m') increment = 60;
        else if (timeframe === '5m') increment = 300;
        else if (timeframe === '15m') increment = 900;
        else if (timeframe === '1h') increment = 3600;
        else if (timeframe === '4h') increment = 14400;
        else if (timeframe === '1W') increment = 604800;

        const time = Math.floor(Date.now() / 1000);
        let value = prices[symbol]?.price || 1.0;
        const volatility = symbol === 'BTCUSD' ? 500 : symbol === 'XAUUSD' ? 10 : 0.002;

        for (let i = 0; i < 100; i++) {
            const close = value;
            const open = value + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random() * (volatility / 2);
            const low = Math.min(open, close) - Math.random() * (volatility / 2);

            data.push({ time: (time - (99 - i) * increment) as Time, open, high, low, close });
            value = open;
        }
        return data;
    }, [timeframe, prices]);

    useEffect(() => {
        setChartData(generateHistory(selectedSymbol));
    }, [selectedSymbol, generateHistory]);

    useEffect(() => {
        setChartData(generateHistory(selectedSymbol));
    }, [selectedSymbol, generateHistory]);

    // Sync last candle with live price
    useEffect(() => {
        if (chartData.length === 0) return;
        setChartData(prev => {
            const newData = [...prev];
            const lastBar = { ...newData[newData.length - 1] };
            const currentPrice = prices[selectedSymbol]?.price || lastBar.close;

            lastBar.close = currentPrice;
            if (currentPrice > lastBar.high) lastBar.high = currentPrice;
            if (currentPrice < lastBar.low) lastBar.low = currentPrice;

            newData[newData.length - 1] = lastBar;
            return newData;
        });
    }, [prices, selectedSymbol, chartData.length]);

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: accountsData } = await supabase.from('accounts').select('*').eq('user_id', user.id);
            if (accountsData) {
                setAccounts(accountsData);
                if (accountsData.length > 0 && !selectedAccountId) {
                    setSelectedAccountId(accountsData[0].id);
                }
            }

            // Removed setTransactions as it's not defined in the original code
            // const { data: transData } = await supabase.from('transactions')
            //     .select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
            // if (transData) setTransactions(transData);

            const { data: tradesData } = await supabase.from('trades')
                .select('*').eq('user_id', user.id).in('status', ['open', 'pending']);
            if (tradesData) setTrades(tradesData as Trade[]);

        } catch (error: unknown) {
            const err = error as Error;
            console.error('Fetch error:', err);
            showToast('Failed to fetch data: ' + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [supabase, selectedAccountId, showToast]); // Added showToast to dependencies

    useEffect(() => {
        fetchData();
        const tradesSub = supabase.channel('trades_changes')
            .on('postgres_changes' as const, { event: '*', schema: 'public', table: 'trades' }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(tradesSub); };
    }, [fetchData, supabase]);

    const handleExecuteTrade = async (
        type: 'buy' | 'sell',
        size: number,
        orderType: 'market' | 'limit',
        advanced?: { limitPrice?: number, stopLoss?: number, takeProfit?: number }
    ) => {
        setIsExecuting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const tradeData = {
                user_id: user.id,
                account_id: accounts[0].id,
                symbol: selectedSymbol,
                type: type,
                size: size,
                entry_price: orderType === 'limit' ? (advanced?.limitPrice || 0) : prices[selectedSymbol].price,
                status: orderType === 'limit' ? 'pending' : 'open',
                stop_loss: advanced?.stopLoss || null,
                take_profit: advanced?.takeProfit || null,
                limit_price: orderType === 'limit' ? advanced?.limitPrice : null,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase.from('trades').insert(tradeData);
            if (error) throw error;

            showToast(`${type.toUpperCase()} order executed successfully.`, 'success');
            fetchData();
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Trade error:', err);
            showToast('Failed to execute trade: ' + err.message, 'error');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleCloseTrade = useCallback(async (tradeId: string, symbol: string, type: string, entryPrice: number, size: number) => {
        setIsExecuting(true);
        try {
            const currentPrice = prices[symbol]?.price || entryPrice;
            const pnl = type === 'buy'
                ? (currentPrice - entryPrice) * size * 100000
                : (entryPrice - currentPrice) * size * 100000;

            await supabase.from('trades').update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                close_price: currentPrice,
                pnl: pnl
            }).eq('id', tradeId);

            const balance = accounts.find(a => a.id === accounts[0].id)?.balance || 0;
            const newBalance = Number(balance) + pnl;
            await supabase.from('accounts').update({ balance: newBalance }).eq('id', accounts[0].id);

            await supabase.from('transactions').insert({
                user_id: (await supabase.auth.getUser()).data.user?.id,
                account_id: accounts[0].id,
                type: pnl >= 0 ? 'profit' : 'loss',
                description: `Trade: ${symbol} ${type.toUpperCase()}`,
                amount: pnl,
                status: 'completed'
            });

            showToast(`Position closed: ${symbol} ${type.toUpperCase()} ($${pnl.toFixed(2)})`, pnl >= 0 ? 'success' : 'info');
            fetchData();
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Closing error:', err);
            showToast("Failed to close trade: " + err.message, 'error');
        } finally {
            setIsExecuting(false);
        }
    }, [prices, accounts, supabase, fetchData, showToast]);

    const handleCloseAll = async () => {
        if (trades.length === 0) return;
        const openAndPending = trades.filter(t => t.status === 'open' || t.status === 'pending');
        if (openAndPending.length === 0) return;

        setIsCloseAllModalOpen(true);
    };

    const executeCloseAll = async () => {
        const openAndPending = trades.filter(t => t.status === 'open' || t.status === 'pending');
        setIsCloseAllModalOpen(false);
        setIsExecuting(true);
        try {
            for (const trade of openAndPending) {
                const currentPrice = prices[trade.symbol]?.price || trade.entry_price;
                let lotSize = 100000;
                if (trade.symbol === 'BTCUSD') lotSize = 1;
                else if (trade.symbol === 'XAUUSD') lotSize = 100;

                const pnl = trade.status === 'pending' ? 0 : (trade.type === 'buy'
                    ? (currentPrice - trade.entry_price) * trade.size * lotSize
                    : (trade.entry_price - currentPrice) * trade.size * lotSize);

                await supabase.from('trades').update({
                    status: 'closed',
                    closed_at: new Date().toISOString(),
                    close_price: currentPrice,
                    pnl: pnl
                }).eq('id', trade.id);

                if (pnl !== 0) {
                    const { data: acc } = await supabase.from('accounts').select('balance').eq('id', accounts[0].id).single();
                    const currentBalance = acc?.balance || 0;
                    await supabase.from('accounts').update({ balance: currentBalance + pnl }).eq('id', accounts[0].id);

                    await supabase.from('transactions').insert({
                        user_id: (await supabase.auth.getUser()).data.user?.id,
                        account_id: accounts[0].id,
                        type: pnl >= 0 ? 'profit' : 'loss',
                        description: `Emergency Close: ${trade.symbol}`,
                        amount: pnl,
                        status: 'completed'
                    });
                }
            }
            showToast('All positions closed successfully.', 'success');
            fetchData();
        } catch (error: unknown) {
            const err = error as Error;
            showToast('Failed to close all: ' + err.message, 'error');
        } finally {
            setIsExecuting(false);
        }
    };

    // Automatic SL/TP & Limit Order Monitor
    useEffect(() => {
        if (trades.length === 0 || isExecuting) return;

        trades.forEach(async (trade) => {
            const currentPrice = prices[trade.symbol]?.price;
            if (!currentPrice) return;

            // 1. Monitor Pending Limit Orders
            if (trade.status === 'pending' && trade.limit_price) {
                const isHit = trade.type === 'buy'
                    ? currentPrice <= trade.limit_price
                    : currentPrice >= trade.limit_price;

                if (isHit) {
                    try {
                        await supabase.from('trades').update({
                            status: 'open',
                            entry_price: currentPrice,
                            created_at: new Date().toISOString()
                        }).eq('id', trade.id);
                        showToast(`Limit Order Executed: ${trade.type.toUpperCase()} ${trade.symbol} at ${currentPrice.toFixed(5)}`, 'success');
                        fetchData();
                    } catch (e) {
                        console.error("Limit activation failed", e);
                    }
                }
            }

            // 2. Monitor SL/TP for Open Trades
            if (trade.status === 'open') {
                let trigger: 'SL' | 'TP' | null = null;

                if (trade.stop_loss) {
                    if (trade.type === 'buy' && currentPrice <= trade.stop_loss) trigger = 'SL';
                    if (trade.type === 'sell' && currentPrice >= trade.stop_loss) trigger = 'SL';
                }

                if (trade.take_profit) {
                    if (trade.type === 'buy' && currentPrice >= trade.take_profit) trigger = 'TP';
                    if (trade.type === 'sell' && currentPrice <= trade.take_profit) trigger = 'TP';
                }

                if (trigger) {
                    showToast(`${trigger} Hit: Closing ${trade.symbol} ${trade.type.toUpperCase()}...`, trigger === 'TP' ? 'success' : 'warning');
                    handleCloseTrade(trade.id, trade.symbol, trade.type, trade.entry_price, trade.size);
                }
            }
        });
    }, [prices, trades, isExecuting, handleCloseTrade, supabase, fetchData, showToast]);

    // Comprehensive Account Risk & Performance Calculation
    const performanceStats = useMemo(() => {
        const balance = accounts.find(a => a.id === selectedAccountId)?.balance || 0;
        let totalUnrealizedPnL = 0;
        let usedMargin = 0;
        const LEVERAGE = 100;

        trades.forEach(trade => {
            if (trade.status !== 'open') return;

            const currentPrice = prices[trade.symbol]?.price || trade.entry_price;
            let lotSize = 100000;

            if (trade.symbol === 'BTCUSD') lotSize = 1;
            else if (trade.symbol === 'XAUUSD') lotSize = 100;

            const pnl = trade.type === 'buy'
                ? (currentPrice - trade.entry_price) * trade.size * lotSize
                : (trade.entry_price - currentPrice) * trade.size * lotSize;

            totalUnrealizedPnL += pnl;
            usedMargin += (trade.size * lotSize * trade.entry_price) / LEVERAGE;
        });

        const equity = Number(balance) + totalUnrealizedPnL;
        const freeMargin = equity - usedMargin;
        const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

        const exposure: Record<string, number> = { Forex: 0, Crypto: 0, Commodities: 0 };
        trades.forEach(t => {
            if (t.status !== 'open') return;
            if (t.symbol === 'BTCUSD') exposure.Crypto += t.size;
            else if (t.symbol === 'XAUUSD') exposure.Commodities += t.size;
            else exposure.Forex += t.size;
        });

        const totalLots = Object.values(exposure).reduce((a, b) => a + b, 0);
        const exposurePct = totalLots > 0 ? {
            Forex: (exposure.Forex / totalLots) * 100,
            Crypto: (exposure.Crypto / totalLots) * 100,
            Commodities: (exposure.Commodities / totalLots) * 100
        } : { Forex: 100, Crypto: 0, Commodities: 0 };

        // New: Performance Metrics (Win Rate, Profit Factor)
        const closedTrades = trades.filter(t => t.status === 'closed');
        const wins = closedTrades.filter(t => t.pnl !== undefined && t.pnl > 0).length;
        const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

        const grossProfit = closedTrades.filter(t => t.pnl !== undefined && t.pnl > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
        const grossLoss = Math.abs(closedTrades.filter(t => t.pnl !== undefined && t.pnl < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 9.99 : 0);

        return {
            balance: Number(balance),
            equity,
            unrealizedPnL: totalUnrealizedPnL,
            usedMargin,
            freeMargin,
            marginLevel,
            exposurePct,
            winRate,
            profitFactor
        };
    }, [accounts, selectedAccountId, trades, prices]);

    // Simple performance metric: Growth since initial $10k
    const growthPercent = useMemo(() => {
        const initial = 10000;
        return ((performanceStats.equity - initial) / initial) * 100;
    }, [performanceStats.equity]);

    if (isLoading) return <div className={styles.dashboard}><div className={styles.loading}>Loading Dashboard...</div></div>;

    return (
        <div className={styles.dashboard}>
            {performanceStats.marginLevel > 0 && performanceStats.marginLevel < 110 && (
                <div className={styles.marginAlert}>
                    <span className={styles.alertIcon}>⚠️</span>
                    <div className={styles.alertContent}>
                        <strong>MARGIN CALL WARNING:</strong> Your margin level is {performanceStats.marginLevel.toFixed(1)}%.
                        Positions may be liquidated if it drops below 50%.
                    </div>
                </div>
            )}
            <section className={styles.statsGrid}>
                <Card variant="glass">
                    <div className={styles.cardLabel}>
                        Account Balance
                        {accounts.find(a => a.id === selectedAccountId)?.type === 'standard' ? (
                            <span className={`${styles.accountBadge} ${styles.demoBadge}`}>Demo</span>
                        ) : (
                            <span className={`${styles.accountBadge} ${styles.liveBadge}`}>Live</span>
                        )}
                    </div>
                    <div className={styles.cardValue}>${performanceStats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className={styles.cardSub}>Realized Cash</div>
                </Card>
                <Card variant="glass">
                    <div className={styles.cardLabel}>Live Equity</div>
                    <div className={styles.cardValue} style={{ color: 'var(--primary-main)' }}>
                        ${performanceStats.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={styles.cardChange}>PnL: <span className={performanceStats.unrealizedPnL >= 0 ? styles.positive : styles.negative}>
                        {performanceStats.unrealizedPnL >= 0 ? '+' : ''}${performanceStats.unrealizedPnL.toFixed(2)}
                    </span></div>
                </Card>
                <Card variant="glass">
                    <div className={styles.cardLabel}>Used Margin</div>
                    <div className={styles.cardValue}>${performanceStats.usedMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className={styles.cardSub}>Free: ${performanceStats.freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </Card>
                <Card variant="glass">
                    <div className={styles.cardLabel}>Win Rate</div>
                    <div className={`${styles.cardValue} ${performanceStats.winRate >= 50 ? styles.positive : styles.negative}`}>
                        {performanceStats.winRate.toFixed(1)}%
                    </div>
                    <div className={styles.cardSub}>
                        Profit Factor: {performanceStats.profitFactor.toFixed(2)}
                    </div>
                </Card>
                <Card variant="glass">
                    <div className={styles.cardLabel}>PERFORMANCE</div>
                    <div className={`${styles.cardValue} ${growthPercent >= 0 ? styles.positive : styles.negative}`}>
                        {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(2)}%
                    </div>
                    <div className={styles.cardSub}>Total Account Growth</div>
                </Card>
                <Card variant="glass">
                    <div className={styles.cardLabel}>ASSET EXPOSURE</div>
                    <div className={styles.exposureContainer}>
                        <div className={styles.exposureBar}>
                            <div className={styles.barSegment} style={{ width: `${performanceStats.exposurePct.Forex}%`, background: '#3b82f6' }} title="Forex" />
                            <div className={styles.barSegment} style={{ width: `${performanceStats.exposurePct.Crypto}%`, background: '#f59e0b' }} title="Crypto" />
                            <div className={styles.barSegment} style={{ width: `${performanceStats.exposurePct.Commodities}%`, background: '#eab308' }} title="Gold" />
                        </div>
                        <div className={styles.exposureLabels}>
                            <span>FX: {performanceStats.exposurePct.Forex.toFixed(0)}%</span>
                            <span>BTC: {performanceStats.exposurePct.Crypto.toFixed(0)}%</span>
                            <span>XAU: {performanceStats.exposurePct.Commodities.toFixed(0)}%</span>
                        </div>
                    </div>
                </Card>
            </section>

            <div className={styles.tradingSection}>
                <section className={styles.tradingView}>
                    <h2 className={styles.sectionTitle}>Execution</h2>
                    <TradingPanel symbol={selectedSymbol} currentPrice={prices[selectedSymbol]?.price || 0} onExecute={handleExecuteTrade} isLoading={isExecuting} />
                </section>

                <section className={styles.chartSection}>
                    <h2 className={styles.sectionTitle}>{selectedSymbol} Live Chart</h2>
                    <Card variant="glass" className={styles.chartContainer}>
                        <Chart data={chartData} symbol={selectedSymbol} currentTimeframe={timeframe} onTimeframeChange={setTimeframe} />
                    </Card>
                </section>

                <section className={styles.marketWatch}>
                    <h2 className={styles.sectionTitle}>Markets</h2>
                    <Card variant="glass" className={styles.marketWrapper}>
                        {Object.values(prices).map(tick => (
                            <div key={tick.symbol} className={`${styles.rowWrapper} ${selectedSymbol === tick.symbol ? styles.selected : ''}`} onClick={() => setSelectedSymbol(tick.symbol)}>
                                <MarketRow tick={tick} />
                            </div>
                        ))}
                    </Card>
                </section>
            </div>

            <section className={styles.openPositions}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Active & Pending Positions</h2>
                    {trades.length > 0 && (
                        <Button variant="outline" size="sm" onClick={handleCloseAll} disabled={isExecuting} className={styles.emergencyBtn}>
                            {isExecuting ? 'Processing...' : 'Close All Positions'}
                        </Button>
                    )}
                </div>
                <Card variant="glass" className={styles.activityTable}>
                    <div className={styles.tableHeader}>
                        <span>Symbol</span><span>Type</span><span>Size</span><span>Price</span><span>Stop/Limit</span><span>Profit</span><span>Status</span><span>Action</span>
                    </div>
                    {trades.length === 0 ? <div className={styles.emptyState}>No active positions</div> : (
                        trades.map(trade => (
                            <PositionRow
                                key={trade.id}
                                trade={trade}
                                currentPrice={prices[trade.symbol]?.price || trade.entry_price}
                                onClose={() => handleCloseTrade(trade.id, trade.symbol, trade.type, trade.entry_price, trade.size)}
                                isClosing={isExecuting}
                            />
                        ))
                    )}
                </Card>
            </section>

            <ConfirmationModal
                isOpen={isCloseAllModalOpen}
                title="Close All Positions?"
                message={`Are you sure you want to emergency close all ${trades.filter(t => t.status === 'open' || t.status === 'pending').length} active and pending positions? This action cannot be undone.`}
                confirmLabel="Close All"
                onConfirm={executeCloseAll}
                onCancel={() => setIsCloseAllModalOpen(false)}
                variant="danger"
            />
        </div>
    );
}

function MarketRow({ tick }: { tick: MarketTick }) {
    const prevPriceRef = useRef(tick.price);
    const [flash, setFlash] = useState<'up' | 'down' | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (tick.price > prevPriceRef.current) setFlash('up');
            else if (tick.price < prevPriceRef.current) setFlash('down');
            prevPriceRef.current = tick.price;
            const timer = setTimeout(() => setFlash(null), 500);
            return () => clearTimeout(timer);
        }, 0);
        return () => clearTimeout(timeout);
    }, [tick.price]);

    return (
        <div className={styles.marketRow}>
            <span className={styles.symbol}>{tick.symbol}</span>
            <span className={`${styles.price} ${flash ? styles[flash] : ''}`}>
                {tick.price.toFixed(tick.symbol.includes('JPY') ? 3 : 5)}
            </span>
            <span className={tick.change >= 0 ? styles.positive : styles.negative}>
                {tick.changePercent.toFixed(2)}%
            </span>
        </div>
    );
}

function PositionRow({ trade, currentPrice, onClose, isClosing }: { trade: Trade, currentPrice: number, onClose: () => void, isClosing: boolean }) {
    const isPending = trade.status === 'pending';
    let lotSize = 100000;
    if (trade.symbol === 'BTCUSD') lotSize = 1;
    else if (trade.symbol === 'XAUUSD') lotSize = 100;

    const pnl = isPending ? 0 : (trade.type === 'buy' ? (currentPrice - trade.entry_price) * trade.size * lotSize : (trade.entry_price - currentPrice) * trade.size * lotSize);
    const priceDecimals = trade.symbol.includes('JPY') ? 3 : 5;

    return (
        <div className={styles.tableRow}>
            <span className={styles.symbol} data-label="Symbol">{trade.symbol}</span>
            <span style={{ color: trade.type === 'buy' ? '#22c55e' : '#ef4444', fontWeight: 600 }} data-label="Type">{trade.type.toUpperCase()}</span>
            <span data-label="Size">{trade.size.toFixed(2)}</span>
            <span data-label="Price">{trade.entry_price.toFixed(priceDecimals)}</span>
            <span className={styles.sltp} data-label="Stop/Limit">
                {trade.stop_loss ? <span className={styles.sl}>SL:{trade.stop_loss.toFixed(priceDecimals)}</span> : ''}
                {trade.take_profit ? <span className={styles.tp}>TP:{trade.take_profit.toFixed(priceDecimals)}</span> : ''}
                {isPending && trade.limit_price ? <span>LMT:{trade.limit_price.toFixed(priceDecimals)}</span> : ''}
                {!trade.stop_loss && !trade.take_profit && !trade.limit_price && '-'}
            </span>
            <span className={pnl >= 0 ? styles.positive : styles.negative} data-label="Profit">
                {isPending ? '-' : `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
            </span>
            <span className={`${styles.badge} ${styles[trade.status]}`} data-label="Status">{trade.status.toUpperCase()}</span>
            <span data-label="Action">
                <Button size="sm" variant="glass" className={styles.closeBtn} onClick={onClose} disabled={isClosing}>
                    {isClosing ? '...' : isPending ? 'Cancel' : 'Close'}
                </Button>
            </span>
        </div>
    );
}
