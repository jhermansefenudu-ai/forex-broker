"use client";
import React, { useEffect, useState, useRef } from 'react';
import styles from './Ticker.module.css';

interface Quote {
    symbol: string;
    bid: string;
    ask: string;
}

export const Ticker: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const prevQuotesRef = useRef<Record<string, string>>({});
    const [flashState, setFlashState] = useState<Record<string, 'up' | 'down' | null>>({});

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const res = await fetch('/api/market/ticker');
                const data = await res.json();
                if (data.success) {
                    const newFlash: Record<string, 'up' | 'down' | null> = {};
                    data.quotes.forEach((q: Quote) => {
                        const prev = parseFloat(prevQuotesRef.current[q.symbol] || q.bid);
                        const curr = parseFloat(q.bid);
                        if (curr > prev) newFlash[q.symbol] = 'up';
                        else if (curr < prev) newFlash[q.symbol] = 'down';
                        prevQuotesRef.current[q.symbol] = q.bid;
                    });
                    setFlashState(newFlash);
                    setQuotes(data.quotes);

                    setTimeout(() => setFlashState({}), 800);
                }
            } catch {
                console.error('Failed to fetch ticker data');
            }
        };

        fetchQuotes();
        const interval = setInterval(fetchQuotes, 3000);
        return () => clearInterval(interval);
    }, []);

    if (quotes.length === 0) return null;

    return (
        <div className={styles.tickerContainer}>
            <div className={styles.tickerTrack}>
                {[...quotes, ...quotes, ...quotes, ...quotes].map((quote, index) => {
                    const flash = flashState[quote.symbol];
                    return (
                        <div key={`${quote.symbol}-${index}`} className={`${styles.tickerItem} ${flash ? styles[flash] : ''}`}>
                            <span className={styles.symbol}>{quote.symbol}</span>
                            <span className={styles.price}>
                                <span className={styles.bid}>{quote.bid}</span>
                                <span className={styles.separator}>/</span>
                                <span className={styles.ask}>{quote.ask}</span>
                            </span>
                            {flash && (
                                <span className={styles.indicator}>
                                    {flash === 'up' ? '▲' : '▼'}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
