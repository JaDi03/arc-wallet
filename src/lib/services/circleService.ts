
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { v4 as uuidv4 } from 'uuid';

const API_KEY = process.env.CIRCLE_API_KEY;
const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;

export class CircleService {
    // Use ReturnType to automatically infer the client type from the init function
    private client: ReturnType<typeof initiateDeveloperControlledWalletsClient>;

    constructor() {
        if (!API_KEY || !ENTITY_SECRET) {
            throw new Error('Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET');
        }
        this.client = initiateDeveloperControlledWalletsClient({
            apiKey: API_KEY,
            entitySecret: ENTITY_SECRET
        });
    }

    // Helper to check connection
    async listWalletSets() {
        try {
            const res = await this.client.listWalletSets({});
            return res.data?.walletSets || [];
        } catch (error) {
            console.error("Circle List Wallet Sets Error:", error);
            throw error;
        }
    }

    async createWallet(userId: string) {
        try {
            // 1. Get Valid Wallet Set
            // Strategy: Try to find an existing set, but be ready to create a new one if the existing one is "stale" or invalid.
            let walletSetId;
            const existingSets = await this.client.listWalletSets({});
            const sets = existingSets.data?.walletSets || [];

            // Try to pick the most recent one (some old sets might be broken)
            const sortedSets = sets.sort((a, b) => new Date(b.createDate!).getTime() - new Date(a.createDate!).getTime());

            if (sortedSets.length > 0) {
                // Check if we have a fresh set (less than 1 day old)
                // If not, maybe better to create new? For now let's try the newest.
                walletSetId = sortedSets[0].id;
                console.log(`Attempting to use existing Wallet Set ID: ${walletSetId}`);
            }

            // Internal Helper to attempt creation
            const attemptCreate = async (setId: string, chains: string[]) => {
                return await this.client.createWallets({
                    idempotencyKey: uuidv4(),
                    blockchains: chains as any, // Cast to any to avoid strict type checks if SDK is outdated
                    accountType: 'SCA',
                    walletSetId: setId,
                    count: 1
                });
            };

            let walletResponse;
            try {
                if (!walletSetId) throw new Error("No set found, force create");
                walletResponse = await attemptCreate(walletSetId, ['ARC-TESTNET', 'ETH-SEPOLIA', 'AVAX-FUJI', 'MATIC-AMOY']);
            } catch (firstAttemptError: any) {
                console.warn("Creation with existing set failed (likely stale set). Creating NEW Wallet Set...");
                const newSetRes = await this.client.createWalletSet({
                    idempotencyKey: uuidv4(),
                    name: `Arc_Global_Set_${Date.now()}`
                });
                walletSetId = newSetRes.data?.walletSet?.id;

                if (!walletSetId) throw new Error("Failed to create a fresh Wallet Set");

                // Retry with new set
                try {
                    walletResponse = await attemptCreate(walletSetId, ['ARC-TESTNET', 'ETH-SEPOLIA', 'AVAX-FUJI', 'MATIC-AMOY']);
                } catch (retryError) {
                    console.warn("Multi-chain on new set failed, trying Sepolia only...");
                    walletResponse = await attemptCreate(walletSetId, ['ETH-SEPOLIA']);
                }
            }

            if (!walletSetId) throw new Error("Failed to obtain a valid Wallet Set ID");

            const wallets = walletResponse.data?.wallets || [];
            if (wallets.length === 0) throw new Error("Failed to create Wallets (Empty response)");

            // Return the ARC wallet as primary, but we have created 4.
            const primaryWallet = wallets.find(w => w.blockchain === 'ARC-TESTNET') || wallets[0];

            return {
                walletId: primaryWallet.id,
                address: primaryWallet.address,
                blockchain: primaryWallet.blockchain,
                allWallets: wallets // Return full list for debug
            };

        } catch (error: any) {
            console.error("Circle Create Wallet Error:", error?.response?.data || error);
            throw error;
        }
    }

    async getWallet(walletId: string) {
        try {
            const res = await this.client.getWallet({ id: walletId });
            return res.data?.wallet;
        } catch (error) {
            console.error("Circle Get Wallet Error:", error);
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

    async createTransaction(walletId: string, tokenId: string, destinationAddress: string, amount: string) {
        try {
            const res = await this.client.createTransaction({
                walletId: walletId,
                idempotencyKey: uuidv4(),
                tokenId: tokenId,
                destinationAddress: destinationAddress,
                amount: [amount],
                fee: {
                    type: 'level',
                    config: {
                        feeLevel: 'MEDIUM'
                    }
                }
            });
            return res.data;
        } catch (error: any) {
            console.error("Circle Transaction Error:", error?.response?.data || error);
            throw error;
        }
    }
}

export const circleService = new CircleService();
