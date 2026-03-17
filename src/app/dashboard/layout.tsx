import { Metadata } from 'next';
import styles from './layout.module.css';

export const metadata: Metadata = {
    title: 'Trader Dashboard',
    description: 'Manage your portfolio, execute trades, and monitor market movements in real-time.',
    robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <main className={styles.main}>{children}</main>;
}
