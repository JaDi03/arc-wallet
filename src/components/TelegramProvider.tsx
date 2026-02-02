'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface TelegramWebApp {
    initData: string;
    initDataUnsafe: any;
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: any;
    isExpanded: boolean;
    headerColor: string;
    backgroundColor: string;
    ready: () => void;
    expand: () => void;
    close: () => void;
}

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}

interface TelegramContextType {
    webApp: TelegramWebApp | null;
    user: TelegramUser | null;
    isReady: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
    webApp: null,
    user: null,
    isReady: false,
});

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [user, setUser] = useState<TelegramUser | null>(null);

    useEffect(() => {
        const initWebApp = () => {
            const app = (window as any).Telegram?.WebApp;
            if (app) {
                app.ready();
                app.expand();
                console.log("Telegram SDK Loaded and Ready");
                setWebApp(app);
                setIsReady(true);
                if (app.initDataUnsafe?.user) {
                    setUser(app.initDataUnsafe.user as TelegramUser);
                }
                // Sync Theme
                document.documentElement.setAttribute('data-theme', app.colorScheme);
            }
        };

        if ((window as any).Telegram?.WebApp) {
            initWebApp();
        } else {
            // Polling fallback in case of delayed script execution
            const interval = setInterval(() => {
                const app = (window as any).Telegram?.WebApp;
                if (app) {
                    initWebApp();
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    return (
        <TelegramContext.Provider value={{ webApp, user, isReady }}>
            {children}
        </TelegramContext.Provider>
    );
}
