"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MotionWrapper } from "@/components/ui/MotionWrapper";
import { createClient } from "@/lib/supabase";
import { useNotification } from "@/components/ui/NotificationProvider";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useNotification();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setIsDemoLoading(true);
    try {
      // Generate random demo credentials
      const randomId = Math.random().toString(36).substring(2, 10);
      const email = `demo_${randomId}@primetrade.io`;
      const password = `demoP@ssword${randomId}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `Demo User ${randomId}`,
            is_demo: true
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      console.error('Demo account creation failed:', error);
      showToast("Failed to create demo account. Please try again.", 'error');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <MotionWrapper direction="up" delay={0.1}>
              <h1 className={styles.title}>
                Trade with <span className={styles.highlight}>Structural Edge</span>
              </h1>
            </MotionWrapper>
            <MotionWrapper direction="up" delay={0.3}>
              <p className={styles.subtitle}>
                Experience ultra-low latency execution on an ECN/STP network.
                The institutional standard for retail traders.
              </p>
            </MotionWrapper>
            <MotionWrapper direction="up" delay={0.5}>
              <div className={styles.ctaGroup}>
                <Button variant="primary" size="lg" onClick={() => router.push('/register')}>
                  Start Trading
                </Button>
                <Button
                  variant="glass"
                  size="lg"
                  onClick={handleTryDemo}
                  disabled={isDemoLoading}
                >
                  {isDemoLoading ? 'Creating Demo...' : 'Try Demo'}
                </Button>
              </div>
            </MotionWrapper>
          </div>
        </div>
        <div className={styles.heroBackground}>
          {/* Abstract glowing effects would use standard divs/svgs in background */}
        </div>
      </section>

      <section className={styles.features}>
        <div className="container">
          <div className={styles.grid}>
            <MotionWrapper direction="up" delay={0.2} className={styles.featureWrapper}>
              <Card variant="glass" className={styles.featureCard}>
                <h3>Raw Spreads</h3>
                <p>From 0.0 pips on major pairs.</p>
              </Card>
            </MotionWrapper>
            <MotionWrapper direction="up" delay={0.4} className={styles.featureWrapper}>
              <Card variant="glass" className={styles.featureCard}>
                <h3>Fast Execution</h3>
                <p>Equinix NY4 servers for &lt;20ms latency.</p>
              </Card>
            </MotionWrapper>
            <MotionWrapper direction="up" delay={0.6} className={styles.featureWrapper}>
              <Card variant="glass" className={styles.featureCard}>
                <h3>No Requotes</h3>
                <p>Pure ECN liquidity with no intervention.</p>
              </Card>
            </MotionWrapper>
          </div>
        </div>
      </section>
    </main>
  );
}
