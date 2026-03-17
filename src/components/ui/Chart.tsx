"use client";
import React, { useEffect, useRef, useState } from 'react';
import {
    createChart,
    ColorType,
    CandlestickData,
    CandlestickSeries,
    ISeriesApi,
    LineSeries,
    IChartApi,
    Time
} from 'lightweight-charts';

interface ChartProps {
    data: CandlestickData[];
    symbol: string;
    onTimeframeChange?: (timeframe: string) => void;
    currentTimeframe?: string;
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
        areaTopColor?: string;
        areaBottomColor?: string;
    };
}

export const Chart: React.FC<ChartProps> = ({ data, symbol, onTimeframeChange, currentTimeframe = '1D', colors }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const smaRef = useRef<ISeriesApi<"Line"> | null>(null);
    const rsiRef = useRef<ISeriesApi<"Line"> | null>(null);

    const [showSma, setShowSma] = useState(true);
    const [showRsi, setShowRsi] = useState(false);

    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: colors?.backgroundColor || 'transparent' },
                textColor: colors?.textColor || '#94a3b8',
                fontSize: 11,
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight || 450,
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                autoScale: true,
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                mode: 0,
            },
        });

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        candlestickSeries.setData(data);
        seriesRef.current = candlestickSeries;
        chartRef.current = chart;

        // Add SMA Series
        const smaSeries = chart.addSeries(LineSeries, {
            color: 'rgba(56, 189, 248, 0.5)',
            lineWidth: 2,
            priceLineVisible: false,
            visible: showSma
        });
        smaRef.current = smaSeries;

        // Add RSI Series (on separate price scale)
        const rsiSeries = chart.addSeries(LineSeries, {
            color: 'rgba(168, 85, 247, 0.7)',
            lineWidth: 2,
            priceLineVisible: false,
            visible: showRsi,
            priceScaleId: 'rsi-scale'
        });

        chart.applyOptions({
            leftPriceScale: {
                visible: showRsi,
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }
        });
        rsiRef.current = rsiSeries;

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [colors, symbol, data, showSma, showRsi]);

    // Update data when it changes
    useEffect(() => {
        if (!seriesRef.current || data.length === 0) return;

        seriesRef.current.setData(data);

        // Update SMA
        if (smaRef.current && showSma) {
            const smaData = data.map((d, i) => {
                if (i < 14) return null;
                const slice = data.slice(i - 14, i);
                const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
                return { time: d.time as Time, value: sum / 14 };
            }).filter(d => d !== null) as { time: Time, value: number }[];
            smaRef.current.setData(smaData);
        }

        // Update RSI
        if (rsiRef.current && showRsi) {
            const rsiData = data.map((d, i) => {
                if (i < 14) return null;
                const slice = data.slice(i - 14, i);
                let gains = 0;
                let losses = 0;
                for (let j = 1; j < slice.length; j++) {
                    const diff = slice[j].close - slice[j - 1].close;
                    if (diff >= 0) gains += diff;
                    else losses += Math.abs(diff);
                }
                const rs = gains / (losses || 1);
                const val = 100 - (100 / (1 + rs));
                return { time: d.time as Time, value: val };
            }).filter(d => d !== null) as { time: Time, value: number }[];
            rsiRef.current.setData(rsiData);
        }
    }, [data, showSma, showRsi]);

    const chartStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
        overflow: 'hidden'
    };

    const overlayStyle: React.CSSProperties = {
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '4px 8px',
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(8px)'
    };

    const btnStyle = (isActive: boolean): React.CSSProperties => ({
        background: isActive ? 'var(--primary-main)' : 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: isActive ? 'white' : '#94a3b8',
        padding: '3px 10px',
        fontSize: '0.7rem',
        fontWeight: 600,
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    });

    return (
        <div style={chartStyle}>
            <div style={overlayStyle}>
                <div style={{ display: 'flex', gap: '5px', marginRight: '10px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '10px' }}>
                    {timeframes.map(tf => (
                        <button
                            key={tf}
                            style={btnStyle(currentTimeframe === tf)}
                            onClick={() => onTimeframeChange?.(tf)}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button style={btnStyle(showSma)} onClick={() => setShowSma(!showSma)}>SMA</button>
                    <button style={btnStyle(showRsi)} onClick={() => setShowRsi(!showRsi)}>RSI</button>
                </div>
            </div>
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};
