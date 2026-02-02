'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the interface for the Telegram WebApp
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
        const app = (window as any).Telegram?.WebApp;
        if (app) {
            app.ready();
            app.expand(); // Always expand to full height

            // Log for debugging
            console.log("Telegram WebApp Initialized:", app);

            setWebApp(app);
            setIsReady(true);

            if (app.initDataUnsafe?.user) {
                setUser(app.initDataUnsafe.user as TelegramUser);
            }

            // Sync Theme
            document.documentElement.setAttribute('data-theme', app.colorScheme);
        }
    }, []);

    return (
        <TelegramContext.Provider value={{ webApp, user, isReady }}>
            <script src="https://telegram.org/js/telegram-web-app.js" async />
            {children}
        </TelegramContext.Provider>
    );
}
