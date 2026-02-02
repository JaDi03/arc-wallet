import { TelegramProvider } from '@/components/TelegramProvider';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
    title: 'ArcWallet',
    description: 'Autonomous Agentic Wallet',
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.svg',
        apple: '/favicon.svg',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#1c1c1e',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Script
                    src="https://telegram.org/js/telegram-web-app.js"
                    strategy="beforeInteractive"
                />
                <TelegramProvider>
                    <div className="telegram-app min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
                        <main className="w-full h-full pb-20">
                            {children}
                        </main>
                    </div>
                </TelegramProvider>
            </body>
        </html>
    );
}
