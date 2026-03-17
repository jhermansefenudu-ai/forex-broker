import { useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export type RealtimePayload =
    | { type: 'profile'; data: { kyc_status: string } }
    | { type: 'transaction'; data: { status: string; amount: number } };

export function useRealtime(userId: string | undefined, onUpdate: (payload: RealtimePayload) => void) {
    const supabase = createClient();

    useEffect(() => {
        if (!userId) return;

        // Listen for profile changes (KYC status)
        const profileChannel = supabase
            .channel('profile-status')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${userId}`
                },
                (payload) => {
                    onUpdate({ type: 'profile', data: payload.new as { kyc_status: string } });
                }
            )
            .subscribe();

        // Listen for transaction changes (Withdrawals)
        const txChannel = supabase
            .channel('transaction-status')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'transactions',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    onUpdate({ type: 'transaction', data: payload.new as { status: string; amount: number } });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(profileChannel);
            supabase.removeChannel(txChannel);
        };
    }, [userId, supabase, onUpdate]);
}
