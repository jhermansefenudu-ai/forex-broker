import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.topSection}>
                    <div className={styles.brand}>
                        <div className={styles.logo}>PrimeTrade FX</div>
                        <p className={styles.tagline}>Institutional Standard Execution</p>
                    </div>

                    <div className={styles.links}>
                        <div className={styles.column}>
                            <h4>Company</h4>
                            <Link href="/about">About Us</Link>
                            <Link href="#">Contact</Link>
                            <Link href="#">Careers</Link>
                        </div>
                        <div className={styles.column}>
                            <h4>Legal</h4>
                            <Link href="#">Privacy Policy</Link>
                            <Link href="#">Terms of Service</Link>
                            <Link href="#">Risk Disclosure</Link>
                        </div>
                    </div>
                </div>

                <div className={styles.compliance}>
                    <p>
                        <strong>Risk Warning:</strong> Trading Forex and CFDs carries a high level of risk to your capital
                        and you should only trade with money you can afford to lose. Trading CFDs may not be suitable
                        for all investors, so please ensure that you fully understand the risks involved.
                    </p>
                    <p>
                        PrimeTrade FX is authorised and regulated by the Financial Conduct Authority (FCA)
                        under reference number 123456. Registered address: 123 Finance Street, London, UK.
                    </p>
                </div>

                <div className={styles.copyright}>
                    &copy; {new Date().getFullYear()} PrimeTrade FX. All rights reserved.
                </div>
            </div>
        </footer>
    );
};
