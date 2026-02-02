
import { sql } from '@vercel/postgres';

// In-Memory Fallback for when Postgres is not connected yet
const memoryDB: Record<string, any> = {};

export class StorageService {

    async init() {
        if (!process.env.POSTGRES_URL) return; // Skip if no DB
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS user_wallets (
                    user_id TEXT PRIMARY KEY,
                    wallet_id TEXT NOT NULL,
                    address TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;
        } catch (e) {
            console.error("DB Init Error (Ignorable if table exists):", e);
        }
    }

    async getWallet(userId: string) {
        if (!process.env.POSTGRES_URL) {
            return memoryDB[userId] || null;
        }
        try {
            const { rows } = await sql`SELECT * FROM user_wallets WHERE user_id = ${userId} LIMIT 1`;
            return rows[0] || null;
        } catch (e) {
            console.warn("DB Read Error, falling back:", e);
            return null;
        }
    }

    async saveWallet(userId: string, walletId: string, address: string) {
        if (!process.env.POSTGRES_URL) {
            memoryDB[userId] = { user_id: userId, wallet_id: walletId, address };
            return;
        }
        try {
            await sql`
                INSERT INTO user_wallets (user_id, wallet_id, address)
                VALUES (${userId}, ${walletId}, ${address})
                ON CONFLICT (user_id) DO UPDATE SET wallet_id = ${walletId}, address = ${address};
            `;
        } catch (e) {
            console.error("DB Write Error:", e);
        }
    }
}

export const storageService = new StorageService();
