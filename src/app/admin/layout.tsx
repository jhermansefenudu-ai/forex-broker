import type { Metadata } from "next";
import styles from "./layout.module.css";

export const metadata: Metadata = {
    title: "Admin Portal",
    description: "Administrative management interface for PrimeTrade FX.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <main className={styles.main}>{children}</main>;
}
