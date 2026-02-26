"use client";

import { useState, useEffect } from 'react';

export interface MarketTick {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    lastTickTime: number;
}

const basePrices: Record<string, number> = {
    EURUSD: 1.08542,
    GBPUSD: 1.26431,
    USDJPY: 149.82,
    XAUUSD: 2024.15,
    BTCUSD: 51240.50
};

export const useMarketData = (symbols: string[] = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD']) => {
    // Initialize state directly to avoid synchronous setState in useEffect
    const [prices, setPrices] = useState<Record<string, MarketTick>>(() => {
        const initialPrices: Record<string, MarketTick> = {};
        symbols.forEach(symbol => {
            const base = basePrices[symbol] || 1.0;
            initialPrices[symbol] = {
                symbol,
                price: base,
                change: 0,
                changePercent: 0,
                lastTickTime: Date.now()
            };
        });
        return initialPrices;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setPrices(prev => {
                const newPrices = { ...prev };
                const symbolsToUpdate = [...symbols].sort(() => 0.5 - Math.random()).slice(0, 2);

                symbolsToUpdate.forEach(symbol => {
                    const current = prev[symbol];
                    if (!current) return;

                    let volatility = 0.0001;
                    if (symbol.includes('BTC')) volatility = 5.0;
                    if (symbol.includes('XAU')) volatility = 0.1;

                    const change = (Math.random() - 0.5) * volatility;
                    const newPrice = current.price + change;
                    const basePrice = basePrices[symbol] || 1.0;
                    const totalChange = newPrice - basePrice;
                    const percent = (totalChange / basePrice) * 100;

                    newPrices[symbol] = {
                        ...current,
                        price: newPrice,
                        change: totalChange,
                        changePercent: percent,
                        lastTickTime: Date.now()
                    };
                });
                return newPrices;
            });
        }, 300);

        return () => clearInterval(interval);
    }, [symbols]);

    return { prices };
};
