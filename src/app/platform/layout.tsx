import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trading Platform',
    description: 'Experience professional-grade execution with our advanced MT5 trading platform. Institutional tools for retail traders.',
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
