import { NextResponse } from 'next/server';

export async function GET() {
    // Simulate checking Authorization header
    // const headersList = headers();
    // const token = headersList.get('authorization');

    // Return mock profile data
    return NextResponse.json({
        success: true,
        data: {
            balance: 12450.00,
            equity: 12450.00,
            margin: 0,
            freeMargin: 12450.00,
            marginLevel: 0,
            activeTrades: 0,
            currency: 'USD',
            accountNumber: '8839201',
            server: 'PrimeTrade-Live-01'
        }
    });
}
