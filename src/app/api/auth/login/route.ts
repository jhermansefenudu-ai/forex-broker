import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Simulate database lookup and password check
        if (email === 'trader@example.com' && password === 'password') {
            return NextResponse.json({
                success: true,
                token: 'mock-jwt-token-xyz-123',
                user: {
                    id: 'usr_8839',
                    name: 'John Doe',
                    email: 'trader@example.com',
                    accountType: 'ECN Prime',
                    kycStatus: 'Verified'
                }
            });
        }

        return NextResponse.json(
            { success: false, message: 'Invalid credentials' },
            { status: 401 }
        );
    } catch {
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
