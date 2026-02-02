
import { initiateDeveloperControlledWalletsClient, DeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { v4 as uuidv4 } from 'uuid';

const API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;

export class CircleService {
    private client: DeveloperControlledWalletsClient;

    constructor() {
        if (!API_KEY || !ENTITY_SECRET) {
            throw new Error('Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET');
        }
        this.client = initiateDeveloperControlledWalletsClient({
            apiKey: API_KEY,
            entitySecret: ENTITY_SECRET
        });
    }

    async createWallet(userId: string) {
        try {
            // 1. Create Wallet Set (if not exists style, but usually we just create one globally or per user group)
            // For simplicity/economy, we might put all users in one WalletSet. 
            // But let's follow the simple path: 1 WalletSet for the User if we want isolation, OR 1 Global WalletSet.
            // Replit example created a NEW WalletSet every time? Let's check.
            // Code: `createWalletSet({ name: "WalletSet 1" })`. YES, it created a set every time. That's likely okay for unique mapping.

            const walletSetRes = await this.client.createWalletSet({
                name: `UserSet_${userId}_${Date.now()}`
            });
            const walletSetId = walletSetRes.data?.walletSet?.id;

            if (!walletSetId) throw new Error("Failed to create Wallet Set");

            // 2. Create Wallet
            // Hardcoding "MATIC-AMOY" or "ETH-SEPOLIA" or similar. Circle supports multiple.
            // Configured for Arc Testnet as requested
            const walletRes = await this.client.createWallets({
                idempotencyKey: uuidv4(),
                blockchains: ['ARC-TESTNET'],
                accountType: 'SCA', // Smart Contract Account
                walletSetId: walletSetId,
                count: 1
            });

            const wallet = walletRes.data?.wallets?.[0];
            if (!wallet) throw new Error("Failed to create Wallet");

            return {
                walletId: wallet.id,
                address: wallet.address,
                blockchain: wallet.blockchain
            };

        } catch (error: any) {
            console.error("Circle Create Wallet Error:", error?.response?.data || error);
            throw error;
        }
    }

    async getBalance(walletId: string) {
        try {
            const res = await this.client.getWalletTokenBalance({
                id: walletId
            });
            return res.data?.tokenBalances || [];
        } catch (error) {
            console.error("Circle Get Balance Error:", error);
            throw error;
        }
    }

    async transfer(walletId: string, destinationAddress: string, amount: string, tokenId: string) {
        try {
            const res = await this.client.createTransaction({
                walletId: walletId,
                idempotencyKey: uuidv4(),

                tokenId: tokenId,
                destinationAddress: destinationAddress,
                amounts: [amount],
                fee: {
                    type: 'level',
                    config: {
                        feeLevel: 'MEDIUM'
                    }
                }
            });
            return res.data;
        } catch (error) {
            console.error("Circle Transfer Error:", error);
            throw error;
        }
    }
}

export const circleService = new CircleService();
