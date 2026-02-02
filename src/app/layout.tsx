import { TelegramProvider } from '@/components/TelegramProvider';
import { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'ArcWallet',
    description: 'Autonomous Agentic Wallet',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
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
