"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MotionWrapper } from "@/components/ui/MotionWrapper";
import { Chart } from "@/components/ui/Chart";
import { Time, CandlestickData } from "lightweight-charts";
import { useMarketData } from "@/hooks/useMarketData";
import styles from "./page.module.css";

// Mock Data Generator for history
const generateData = () => {
    const data: CandlestickData[] = [];
    let time = (Math.floor(Date.now() / 1000) - (86400 * 100)) as Time;
    let value = 1.0850;
    for (let i = 0; i < 100; i++) {
        const open = value;
        const high = value + Math.random() * 0.0050;
        const low = value - Math.random() * 0.0050;
        const close = Math.random() > 0.5 ? high - Math.random() * 0.0020 : low + Math.random() * 0.0020;

        data.push({ time: time as Time, open, high, low, close });
        time = (Number(time) + 86400) as Time;
        value = close;
    }
    return data;
};

export default function Platform() {
    const { prices } = useMarketData(['EURUSD']);
    const [chartData, setChartData] = useState<CandlestickData[]>(() => generateData());

    // Initial data load is handled by initializer now
    useEffect(() => {
        // Just a placeholder if we need more logic later
    }, []);

    // Handle real-time updates
    useEffect(() => {
        const eurUsd = prices['EURUSD'];
        if (!eurUsd) return;

        queueMicrotask(() => {
            setChartData(prev => {
                if (prev.length === 0) return prev;
                const newData = [...prev];
                const lastBar = { ...newData[newData.length - 1] };

                // Only update if the price has changed significantly or is different
                if (lastBar.close === eurUsd.price) return prev;

                lastBar.close = eurUsd.price;
                if (eurUsd.price > lastBar.high) lastBar.high = eurUsd.price;
                if (eurUsd.price < lastBar.low) lastBar.low = eurUsd.price;

                newData[newData.length - 1] = lastBar;
                return newData;
            });
        });
    }, [prices]);

    return (
        <main className={styles.main}>

            <section className={styles.hero}>
                <div className="container">
                    <MotionWrapper direction="down">
                        <h1 className={styles.title}>MetaTrader 5</h1>
                    </MotionWrapper>
                    <MotionWrapper direction="up" delay={0.2}>
                        <p className={styles.subtitle}>
                            The multi-asset platform of choice for traders globally.
                            Superior tools, algorithmic trading, and depth of market.
                        </p>
                    </MotionWrapper>
                    <MotionWrapper direction="up" delay={0.4}>
                        <div className={styles.platformActions}>
                            <Button variant="primary" size="lg">Login to WebTrader</Button>
                            <Button variant="glass" size="lg">Download for Windows</Button>
                            <Button variant="glass" size="lg">Download for Mac</Button>
                        </div>
                    </MotionWrapper>
                </div>
            </section>

            <section className={styles.webTrader}>
                <div className="container">
                    <MotionWrapper direction="up" delay={0.6}>
                        <Card variant="glass" className={styles.traderContainer}>
                            <div className={styles.iframeHeader}>
                                <div className={styles.dot}></div>
                                <div className={styles.dot}></div>
                                <div className={styles.dot}></div>
                                <span className={styles.iframeTitle}>EUR/USD - 1D Live</span>
                            </div>
                            <div className={styles.chartWrapper}>
                                <Chart data={chartData} symbol="EURUSD" />
                            </div>
                        </Card>
                    </MotionWrapper>
                </div>
            </section>

            <section className={styles.features}>
                <div className="container">
                    <div className={styles.grid}>
                        <MotionWrapper direction="up" delay={0.2} className={styles.featureItemWrapper}>
                            <Card className={styles.featureItem}>
                                <h3>Algorithmic Trading</h3>
                                <p>Execute automated trading strategies with Expert Advisors (EAs).</p>
                            </Card>
                        </MotionWrapper>
                        <MotionWrapper direction="up" delay={0.4} className={styles.featureItemWrapper}>
                            <Card className={styles.featureItem}>
                                <h3>Depth of Market</h3>
                                <p>View market liquidity and execute orders with precision.</p>
                            </Card>
                        </MotionWrapper>
                        <MotionWrapper direction="up" delay={0.6} className={styles.featureItemWrapper}>
                            <Card variant="glass" className={styles.featureItem}>
                                <h3>21 Timeframes</h3>
                                <p>Comprehensive analysis from 1-minute to monthly charts.</p>
                            </Card>
                        </MotionWrapper>
                    </div>
                </div>
            </section>
        </main>
    );
}
