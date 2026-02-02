import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';
import axios from 'axios';

// SDK Modules
import { AuthModule } from './auth';
// Transaction/Escrow modules will be added later when needed
// import { TransactionModule } from './transaction'; 

export interface ArcWorkerConfig {
    appId: string;
    environment?: 'sandbox' | 'live';
    rpcUrl?: string; // Optional custom RPC
}

/**
 * ArcWallet SDK
 * The main entry point for the Agentic Wallet Integrations.
 */
export class ArcWallet {
    private config: ArcWorkerConfig;
    private sdk: W3SSdk | null = null;

    // Modules
    public auth: AuthModule;

    constructor(config: ArcWorkerConfig) {
        this.config = {
            environment: 'live',
            rpcUrl: 'https://rpc.testnet.arc.network',
            ...config
        };

        // Initialize Modules
        this.auth = new AuthModule(this);

        // Initialize Core Circle SDK if in browser
        if (typeof window !== 'undefined') {
            this.initCircleSdk();
        }
    }

    private initCircleSdk() {
        if (!window.__circle_sdk_instance) {
            window.__circle_sdk_instance = new W3SSdk({
                appSettings: { appId: this.config.appId }
            });
        }
        this.sdk = window.__circle_sdk_instance;
    }

    /**
     * Internal: Access to the low-level Circle SDK
     */
    public getCircleSdk(): W3SSdk | null {
        return this.sdk;
    }

    /**
     * Internal: Get Config
     */
    public getConfig(): ArcWorkerConfig {
        return this.config;
    }
}

// Global declaration for the SDK instance to survive HMR
declare global {
    interface Window {
        __circle_sdk_instance?: W3SSdk;
    }
}
