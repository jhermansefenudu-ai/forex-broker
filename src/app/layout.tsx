import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Ticker } from "@/components/ui/Ticker";
import { NotificationProvider } from "@/components/ui/NotificationProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://primetradefx.com"),
  title: {
    default: "PrimeTrade FX | Premium ECN Broker",
    template: "%s | PrimeTrade FX"
  },
  description: "Experience ultra-low latency trading with true ECN execution. Professional tools for professional traders.",
  keywords: ["forex", "trading", "ECN", "low spread", "MT5", "forex broker", "scalping"],
  authors: [{ name: "PrimeTrade FX Team" }],
  openGraph: {
    title: "PrimeTrade FX | Premium ECN Broker",
    description: "Professional ECN trading platform with ultra-low latency execution.",
    url: "https://primetradefx.com",
    siteName: "PrimeTrade FX",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PrimeTrade FX Trading Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrimeTrade FX | Premium ECN Broker",
    description: "Professional ECN trading platform with ultra-low latency execution.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <NotificationProvider>
          <Header />
          {children}
          <Footer />
          <Ticker />
        </NotificationProvider>
      </body>
    </html>
  );
}
