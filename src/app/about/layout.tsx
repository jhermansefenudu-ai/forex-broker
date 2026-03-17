import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About PrimeTrade FX',
    description: 'Learn about our mission, regulatory compliance, and why we are the preferred choice for professional traders worldwide.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
