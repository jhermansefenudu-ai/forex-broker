import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trading Accounts',
    description: 'Compare our Standard, ECN Prime, and VIP Institutional accounts. Choose the execution model that fits your strategy.',
};

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
