
import { NextResponse } from 'next/server';
import { circleService } from '@/lib/services/circleService';
import { storageService } from '@/lib/services/storageService';
import { validateTelegramWebAppData } from '@/lib/auth/telegram';

export async function POST(request: Request) {
    try {
        const { initData, mockId } = await request.json();

        let userId: string | null = null;

        // 1. Validation Logic
        if (process.env.NODE_ENV === 'development' && mockId) {
            // Dev Bypass
            userId = String(mockId);
            console.log("⚠️ Using Mock User ID:", userId);
        } else if (initData) {
            // Production Secure Validation
            const validated = validateTelegramWebAppData(initData);
            if (!validated) {
                return NextResponse.json({ error: 'Invalid Telegram Signature' }, { status: 401 });
            }
            userId = String(validated.user.id);
        } else {
            return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
        }

        // Ensure DB is ready
        await storageService.init();

        // 2. Check if wallet exists
        const existing = await storageService.getWallet(userId);
        if (existing) {
            // Fetch real-time balance
            try {
                const balances = await circleService.getBalance(existing.wallet_id);
                return NextResponse.json({
                    exists: true,
                    wallet: existing,
                    balances
                });
            } catch (e) {
                console.warn("Failed to fetch balance, returning cached wallet", e);
                return NextResponse.json({ exists: true, wallet: existing, balances: [] });
            }
        }

        // 3. Create new wallet
        console.log(`Creating new wallet for verified User ID: ${userId}`);
        const newWallet = await circleService.createWallet(userId);

        // 4. Save to DB
        await storageService.saveWallet(userId, newWallet.walletId, newWallet.address);

        return NextResponse.json({
            exists: false,
            created: true,
            wallet: {
                wallet_id: newWallet.walletId,
                address: newWallet.address
            },
            balances: []
        });

    } catch (error: any) {
        console.error("Mini App Wallet API Error:", error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
