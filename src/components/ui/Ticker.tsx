"use client";
import React, { useEffect, useState } from 'react';
import styles from './Ticker.module.css';

interface Quote {
    symbol: string;
    bid: string;
    ask: string;
}

export const Ticker: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const res = await fetch('/api/market/ticker');
                const data = await res.json();
                if (data.success) {
                    setQuotes(data.quotes);
                }
            } catch {
                console.error('Failed to fetch ticker data');
            }
        };

        fetchQuotes();
        const interval = setInterval(fetchQuotes, 3000); // Update every 3 seconds
        return () => clearInterval(interval);
    }, []);

    if (quotes.length === 0) return null;

    return (
        <div className={styles.tickerContainer}>
            <div className={styles.tickerTrack}>
                {[...quotes, ...quotes, ...quotes].map((quote, index) => (
                    <div key={`${quote.symbol}-${index}`} className={styles.tickerItem}>
                        <span className={styles.symbol}>{quote.symbol}</span>
                        <span className={styles.bid}>{quote.bid}</span>
                        <span className={styles.spread}>/</span>
                        <span className={styles.ask}>{quote.ask}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
