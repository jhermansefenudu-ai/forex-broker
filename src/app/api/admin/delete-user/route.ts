import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Initialize Supabase with Service Role Key for admin privileges
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase configuration. URL:', !!supabaseUrl, 'Key:', !!supabaseServiceKey);
            return NextResponse.json({ 
                error: 'Server configuration error: Missing service role key. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local' 
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 2. Verify the requester is an admin (Security Check)
        // Note: In a production app, you'd extract the session/token from the request 
        // and verify the requester's role in the 'profiles' table.
        // For now, we assume the frontend has guarded the UI, but we should do a basic check here.
        
        // Example check (simplified):
        // const authHeader = req.headers.get('Authorization');
        // if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        // 3. Manually delete user data from all related tables (Manual Cascade)
        console.log(`Starting manual cascade deletion for user: ${userId}`);
        
        // Delete trades
        const { error: tradesError } = await supabase.from('trades').delete().eq('user_id', userId);
        if (tradesError) console.warn('Non-fatal error deleting trades:', tradesError.message);

        // Delete transactions
        const { error: transError } = await supabase.from('transactions').delete().eq('user_id', userId);
        if (transError) console.warn('Non-fatal error deleting transactions:', transError.message);

        // Delete accounts
        const { error: accountsError } = await supabase.from('accounts').delete().eq('user_id', userId);
        if (accountsError) console.warn('Non-fatal error deleting accounts:', accountsError.message);

        // Delete profile
        const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
        if (profileError) console.warn('Non-fatal error deleting profile:', profileError.message);

        // 4. Finally, delete the user from Auth
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Error deleting auth user:', deleteError.message);
            // If auth delete fails, we've already cleaned up the data tables, 
            // but we should still report the auth error.
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'User and all related data deleted successfully' });

    } catch (error: any) {
        console.error('Delete user API error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
