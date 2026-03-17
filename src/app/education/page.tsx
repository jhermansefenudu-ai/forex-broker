import Image from 'next/image';
import { Card } from "@/components/ui/Card";
import { MotionWrapper } from "@/components/ui/MotionWrapper";
import styles from "./page.module.css";

export default function Education() {
    const articles = [
        {
            title: "Forex Trading for Beginners",
            category: "Guide",
            readTime: "5 min",
            image: "/images/education_guide.png",
            description: "Master the basics of currency pairs, lots, pips, and market mechanics to start your trading journey today."
        },
        {
            title: "Understanding ECN vs STP",
            category: "Technical",
            readTime: "8 min",
            image: "/images/technical_analysis.png",
            description: "Deep dive into execution models. Learn the difference between raw spreads and market marker models."
        },
        {
            title: "Risk Management Strategies",
            category: "Risk",
            readTime: "10 min",
            image: "/images/risk_management.png",
            description: "Protect your capital with professional-grade position sizing and drawdown management techniques."
        },
        {
            title: "Weekly Market Outlook",
            category: "Analysis",
            readTime: "3 min",
            image: "/images/technical_analysis.png",
            description: "Our analysts break down the key economic events and technical setups for the coming trading week."
        },
        {
            title: "Using MT5 Like a Pro",
            category: "Platform",
            readTime: "12 min",
            image: "/images/trading_platform.png",
            description: "A comprehensive guide to leveraging specialized MetaTrader 5 features for quantitative analysis."
        },
        {
            title: "Economic Calendar Explained",
            category: "Fundamental",
            readTime: "6 min",
            image: "/images/education_guide.png",
            description: "How to trade high-impact news events and understand the ripple effects of interest rate decisions."
        },
    ];

    return (
        <main className={styles.main}>

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
                                    <div className={styles.imageWrapper}>
                                        <Image
                                            src={article.image}
                                            alt={article.title}
                                            className={styles.articleImage}
                                            width={400}
                                            height={250}
                                            priority={index < 2}
                                        />
                                        <div className={styles.categoryBadge}>{article.category}</div>
                                    </div>
                                    <div className={styles.cardContent}>
                                        <div className={styles.meta}>
                                            <span className={styles.readTime}>{article.readTime} reading time</span>
                                        </div>
                                        <h3 className={styles.articleTitle}>{article.title}</h3>
                                        <p className={styles.articleDescription}>{article.description}</p>
                                        <a href="#" className={styles.readMore}>
                                            Read Article
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                <polyline points="12 5 19 12 12 19"></polyline>
                                            </svg>
                                        </a>
                                    </div>
                                </Card>
                            </MotionWrapper>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
