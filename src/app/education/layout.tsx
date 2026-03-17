import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Trader's Hub | Education",
    description: 'Master the markets with our comprehensive educational guides. From technical analysis to institutional risk management.',
};

export default function EducationLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
