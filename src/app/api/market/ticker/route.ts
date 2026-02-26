import { NextResponse } from 'next/server';

function getRandomPrice(base: number, variance: number) {
    const change = (Math.random() - 0.5) * variance;
    return (base + change).toFixed(5);
}

export async function GET() {
    const timestamp = new Date().toISOString();

    const quotes = [
        { symbol: 'EURUSD', bid: getRandomPrice(1.0850, 0.0005), ask: getRandomPrice(1.0851, 0.0005) },
        { symbol: 'GBPUSD', bid: getRandomPrice(1.2640, 0.0006), ask: getRandomPrice(1.2642, 0.0006) },
        { symbol: 'USDJPY', bid: getRandomPrice(148.20, 0.05), ask: getRandomPrice(148.22, 0.05) },
        { symbol: 'XAUUSD', bid: getRandomPrice(2035.50, 1.00), ask: getRandomPrice(2036.00, 1.00) }, // Gold
        { symbol: 'BTCUSD', bid: getRandomPrice(42500.00, 50.00), ask: getRandomPrice(42510.00, 50.00) }, // Crypto
    ];

    return NextResponse.json({
        success: true,
        timestamp,
        quotes
    });
}
