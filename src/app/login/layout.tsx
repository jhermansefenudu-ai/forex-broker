import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login',
    description: 'Access your PrimeTrade FX account and start trading.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
