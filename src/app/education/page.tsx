import React from 'react';
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { MotionWrapper } from "@/components/ui/MotionWrapper";
import styles from "./page.module.css";

export default function Education() {
    const articles = [
        { title: "Forex Trading for Beginners", category: "Guide", readTime: "5 min" },
        { title: "Understanding ECN vs STP", category: "Technical", readTime: "8 min" },
        { title: "Risk Management Strategies", category: "Risk", readTime: "10 min" },
        { title: "Weekly Market Outlook", category: "Analysis", readTime: "3 min" },
        { title: "Using MT5 Like a Pro", category: "Platform", readTime: "12 min" },
        { title: "Economic Calendar Explained", category: "Fundamental", readTime: "6 min" },
    ];

    return (
        <main className={styles.main}>
            <Header />

            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.title}>Trader&apos;s Hub</h1>
                    <p className={styles.subtitle}>
                        Master the markets with our comprehensive educational resources and daily analysis.
                    </p>
                </div>
            </section>

            <section className={styles.content}>
                <div className="container">
                    <div className={styles.grid}>
                        {articles.map((article, index) => (
                            <MotionWrapper
                                key={index}
                                direction="up"
                                delay={index * 0.1}
                                className={styles.articleCardWrapper}
                            >
                                <Card variant="glass" className={styles.articleCard}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.category}>{article.category}</span>
                                        <span className={styles.readTime}>{article.readTime}</span>
                                    </div>
                                    <h3>{article.title}</h3>
                                    <p>Learn the essentials of {article.title.toLowerCase()} and improve your trading edge.</p>
                                    <a href="#" className={styles.readMore}>Read Article &rarr;</a>
                                </Card>
                            </MotionWrapper>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
