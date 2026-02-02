import axios from 'axios';
import crypto from 'crypto';

// ArcWallet Server-Side Wallet Utilities

const circleClient = axios.create({
    baseURL: 'https://api.circle.com/v1/w3s',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Ensure key and environment are determined on every request
circleClient.interceptors.request.use((config) => {
    const rawKey = process.env.CIRCLE_API_KEY;
    if (!rawKey) {
        console.error('[ArcWallet SDK] CRITICAL: CIRCLE_API_KEY is missing!');
        throw new Error('Circle API Key is not configured in .env');
    }

    const cleanKey = rawKey.replace(/['"]+/g, '').trim();
    const isSandbox = cleanKey.includes('TEST');

    config.headers['Authorization'] = `Bearer ${cleanKey}`;

    return config;
});

export async function getOrCreateCircleUser(userId: string) {
    let rawId = userId.split('@')[0];

    // Auto-sanitization for Telegram IDs (e.g. "user_123")
    const sanitized = rawId.replace(/[^a-z0-9_-]/g, '_');

    // Try to find
    try {
        const response = await circleClient.get(`/users/${sanitized}`);
        if (response.data.data) {
            return { ...response.data.data, userId: response.data.data.id || sanitized };
        }
    } catch (e: any) { }

    // Create
    try {
        const response = await circleClient.post('/users', { userId: sanitized });
        return { ...response.data.data, userId: sanitized };
    } catch (createError: any) {
        if (createError.response?.status === 409) {
            const response = await circleClient.get(`/users/${sanitized}`);
            return { ...response.data.data, userId: sanitized };
        }
        throw createError;
    }
}

export async function createCircleSession(userId: string) {
    try {
        const user = await getOrCreateCircleUser(userId);
        const actualId = user.userId || userId;

        const response = await circleClient.post('/users/token', { userId: actualId });
        return {
            userToken: response.data.data.userToken,
            encryptionKey: response.data.data.encryptionKey,
            userId: actualId
        };
    } catch (error: any) {
        throw error;
    }
}

export async function getCircleWallets(userToken: string) {
    try {
        const response = await circleClient.get('/wallets', {
            headers: { 'X-User-Token': userToken }
        });
        return response.data.data.wallets || [];
    } catch (e: any) {
        throw e;
    }
}

export async function getCircleBalances(userToken: string, walletId: string) {
    try {
        const response = await circleClient.get(`/wallets/${walletId}/balances`, {
            headers: { 'X-User-Token': userToken }
        });
        return response.data.data.tokenBalances || [];
    } catch (e: any) {
        throw e;
    }
}

export async function createCircleTransfer(userToken: string, walletId: string, destinationAddress: string, amount: string, tokenId?: string) {
    const payload: any = {
        idempotencyKey: crypto.randomUUID(),
        walletId,
        destinationAddress,
        amounts: [amount.toString()],
        feeLevel: 'HIGH',
    };
    if (tokenId) payload.tokenId = tokenId;

    const response = await circleClient.post('/user/transactions/transfer', payload, {
        headers: { 'X-User-Token': userToken }
    });
    return response.data.data.challengeId;
}

export async function initializeCircleWallet(userToken: string) {
    const response = await circleClient.post('/user/initialize', {
        idempotencyKey: crypto.randomUUID(),
        accountType: 'SCA',
        blockchains: ['ARC-TESTNET'], // Default chain
    }, {
        headers: { 'X-User-Token': userToken }
    });
    return response.data.data.challengeId;
}
