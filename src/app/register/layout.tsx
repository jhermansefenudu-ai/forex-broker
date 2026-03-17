import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Join PrimeTrade FX and start your professional trading journey today.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
