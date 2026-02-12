import type { Metadata } from 'next';
import React from 'react';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';
import SessionWrapper from '@/components/providers/SessionWrapper';
import { ThemeProvider } from 'next-themes';
import { ConditionalOfflineFeatures } from '@/components/ConditionalOfflineFeatures';
import { SWInitializer } from '@/components/SWInitializer';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import DebugGrids from '@/components/debugGrids';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Math Learning App',
    default: 'Math Learning App - Interactive Mathematics Platform',
  },
  description: 'Interactive mathematics learning platform with lessons and exercises',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Math Learning App',
  },
  applicationName: 'Math Learning App',
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
};

const isDebug = process.env.NODE_ENV !== 'production';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='uk' suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionWrapper>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <SWInitializer />
            <ConditionalOfflineFeatures 
              enableOfflineFeatures={true}
              performanceThreshold={1500} // Adjust based on testing
            >
              {children}
            </ConditionalOfflineFeatures>
            {isDebug && <PerformanceDashboard />}
            {isDebug && <DebugGrids />}
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
