import { useState, useCallback, useEffect } from 'react';
import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';
import axios from 'axios';

// SDK HOOKS - Copied verbatim from ArcWorker but adjusted path to server routes if needed (keeping same specific routes for now)

// Move SDK instance and callback to global scope to survive HMR/Re-renders
declare global {
    interface Window {
        __circle_sdk_instance?: W3SSdk;
        __circle_sdk_callback?: (error: any, result: any) => void;
        __circle_pending_result?: { error: any, result: any };
        __circle_initial_hash?: string;
    }
}

// Storage keys for redirect persistence
const STORAGE_KEYS = {
    PENDING_LOGIN: 'arc_social_pending',
    USER_CONTEXT: 'arc_social_user_context',
    SESSION_DATA: 'arc_social_session_data'
};

function getSdk() {
    if (typeof window === 'undefined') return null;

    const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || '';

    if (!window.__circle_sdk_instance) {
        const onLoginComplete = (error: any, result: any) => {
            if (error) {
                // Keep error logs but minimize them
                console.error("[ArcWallet SDK] Auth Error:", error.message || error);
            }

            // Store result in case no listener is ready yet
            window.__circle_pending_result = { error, result };

            if (window.__circle_sdk_callback) {
                window.__circle_sdk_callback(error, result);
            }
        };

        window.__circle_sdk_instance = new W3SSdk({
            appSettings: { appId }
        }, onLoginComplete);
    }

    // Ensure essential settings are updated
    window.__circle_sdk_instance.setAppSettings({ appId });

    return window.__circle_sdk_instance;
}

export function useArcWallet() {
    const [isLoading, setIsLoading] = useState(false);
    const [loginType, setLoginType] = useState<'email' | 'social' | 'custom' | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [preFetchedDeviceId, setPreFetchedDeviceId] = useState<string | null>(null);

    // Customize UI for a premium look
    const customizeSDKUI = useCallback((title?: string, subtitle?: string) => {
        const sdk = getSdk();
        if (!sdk) return;

        // Using vibrant premium colors: Deep purple/indigo with gradient-like tones
        (sdk as any).setThemeColor?.('#6366f1'); // Indigo 500

        if (title) (sdk as any).setTitle?.(title);
        if (subtitle) (sdk as any).setSubtitle?.(subtitle);
    }, []);

    // Finalize onboarding after userToken is acquired
    const finishSocialOnboarding = useCallback(async (userToken: string, encryptionKey: string) => {
        const sdk = getSdk();
        if (!sdk) throw new Error("SDK not initialized");

        try {
            console.log("[ArcWallet SDK] Finalizing Session...");

            // 1. Authenticate SDK
            sdk.setAuthentication({ userToken, encryptionKey });

            // 2. Initialize wallet or get existing
            const { data } = await axios.post('/api/circle/wallet', { userToken });
            const { challengeId, address: preFetchedAddress, userId: canonicalId } = data;

            if (challengeId) {
                console.log("[ArcWallet SDK] Executing PIN/Security Challenge...");
                await new Promise((resolve, reject) => {
                    sdk.execute(challengeId, (error: any, result: any) => {
                        if (error) reject(new Error(error.message || "Challenge failed"));
                        else resolve(result);
                    });
                });
            }

            // 3. Poll for address if needed
            let address = preFetchedAddress;
            let finalUserId = canonicalId;
            if (!address) {
                console.log("[ArcWallet SDK] Polling for wallet address...");
                let retries = 10;
                while (retries > 0 && !address) {
                    await new Promise(r => setTimeout(r, 2000));
                    const res = await axios.post('/api/circle/wallet/address', { userToken });
                    address = res.data.address;
                    if (res.data.userId) finalUserId = res.data.userId;
                    retries--;
                }
            }

            // 4. Finalize
            if (!address) throw new Error("Wallet creation timeout");

            localStorage.setItem('arc_session_token', userToken);
            localStorage.setItem('arc_encryption_key', encryptionKey);
            if (finalUserId) {
                localStorage.setItem('arc_circle_user_id', finalUserId);
            }

            return { address, userToken, userId: finalUserId };
        } catch (err: any) {
            console.error("[ArcWallet SDK] Finalization failed:", err);
            throw err;
        }
    }, []);

    // Pre-fetch Device ID once on mount
    useEffect(() => {
        const fetchId = async () => {
            try {
                const sdk = getSdk();
                if (sdk) {
                    const dId = await sdk.getDeviceId();
                    setPreFetchedDeviceId(dId);
                }
            } catch (e) { }
        };
        if (typeof window !== 'undefined' && !preFetchedDeviceId) {
            fetchId();
        }
    }, [preFetchedDeviceId]);


    // PIN Only (Custom Auth) - Used for Telegram ID Bridge
    const setupPinOnlyWallet = useCallback(async (userId: string) => {
        setIsLoading(true);
        setLoginType('custom');
        setStatusMessage('Initializing Secure Environment...');
        setError(null);
        console.log("[ArcWallet SDK] Starting PIN-Only onboarding for:", userId);

        try {
            const sdk = getSdk();
            if (!sdk) throw new Error("SDK not initialized");

            customizeSDKUI("Create PIN", "Set your 6-digit security code");

            // 1. Get Session from Custom Auth Route (No OTP)
            setStatusMessage('Verifying Identity...');
            const authResponse = await axios.post('/api/circle/auth/custom', { userId });
            const { userToken, encryptionKey } = authResponse.data;
            const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || '';

            // 2. Authenticate SDK
            sdk.setAppSettings({ appId });
            sdk.setAuthentication({ userToken, encryptionKey });

            // 3. Create Wallet (Get Challenge)
            setStatusMessage('Preparing PIN Pad...');
            const walletResponse = await axios.post('/api/circle/wallet', { userToken });
            const { challengeId, address: preFetchedAddress } = walletResponse.data;

            if (challengeId) {
                console.log("[ArcWallet SDK] Executing PIN setup (Challenge)...");
                await new Promise((resolve, reject) => {
                    sdk.execute(challengeId, (error: any, result: any) => {
                        if (error) {
                            const msg = error.message || error.code || JSON.stringify(error);
                            console.error("[ArcWallet SDK] PIN Setup Error:", msg);
                            reject(new Error(msg));
                        } else {
                            console.log("[ArcWallet SDK] PIN Setup Success");
                            resolve(result);
                        }
                    });
                });
            } else if (preFetchedAddress) {
                console.log("[ArcWallet SDK] Wallet already exists:", preFetchedAddress);
                return preFetchedAddress;
            }

            // 4. Poll for Address
            let finalAddress = null;
            let retries = 15;
            console.log("[ArcWallet SDK] Finalizing wallet...");
            await new Promise(resolve => setTimeout(resolve, 3000));

            while (retries > 0 && !finalAddress) {
                const addressResponse = await axios.post('/api/circle/wallet/address', { userToken });
                finalAddress = addressResponse.data.address;
                if (!finalAddress) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    retries--;
                }
            }

            console.log("[ArcWallet SDK] PIN Flow Complete. Address:", finalAddress);

            // Persist tokens for session reuse
            localStorage.setItem('arc_session_token', userToken);
            localStorage.setItem('arc_encryption_key', encryptionKey);

            return { address: finalAddress || "PENDING_ADDRESS", userToken, userId };

        } catch (err: any) {
            const detail = err.response?.data?.details?.message || err.message || JSON.stringify(err);
            console.error('[ArcWallet SDK] PIN Flow Error:', detail);
            setError(detail);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [customizeSDKUI]);

    return {
        setupPinOnlyWallet,
        isLoading,
        statusMessage,
        error
    };
}
