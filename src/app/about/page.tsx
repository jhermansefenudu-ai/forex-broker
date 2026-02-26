import React from 'react';
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

export default function About() {
    return (
        <main className={styles.main}>
            <Header />

            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.title}>About PrimeTrade FX</h1>
                    <p className={styles.subtitle}>
                        Founded by traders, for traders. Our mission is to provide a transparent,
                        low-latency trading environment without conflict of interest.
                    </p>
                </div>
            </section>

            <section className={styles.section}>
                <div className="container">
                    <div className={styles.grid}>
                        <div className={styles.col}>
                            <h2>Our Mission</h2>
                            <p>
                                To Democratize institutional-grade trading. We believe every trader deserves
                                access to raw liquidity and lighting-fast execution, regardless of account size.
                            </p>
                        </div>
                        <div className={styles.col}>
                            <h2>Regulatory Compliance</h2>
                            <p>
                                PrimeTrade FX is authorized and regulated by top-tier financial authorities.
                                We adhere to strict capital requirements and segregation of client funds.
                            </p>
                            <ul className={styles.list}>
                                <li>FCA (UK) License No. 123456</li>
                                <li>ASIC (Australia) AFSL 987654</li>
                                <li>CySEC (Cyprus) License 000/00</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.stats}>
                <div className="container">
                    <div className={styles.statsGrid}>
                        <Card variant="bordered" className={styles.statCard}>
                            <h3>$10B+</h3>
                            <p>Monthly Volume</p>
                        </Card>
                        <Card variant="bordered" className={styles.statCard}>
                            <h3>150+</h3>
                            <p>Countries Served</p>
                        </Card>
                        <Card variant="bordered" className={styles.statCard}>
                            <h3>24/5</h3>
                            <p>Dedicated Support</p>
                        </Card>
                    </div>
                </div>
            </section>
        </main>
    );
}
