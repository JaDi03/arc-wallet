
import crypto from 'crypto';

interface User {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}

interface ValidatedData {
    user: User;
    auth_date: number;
    query_id?: string;
    hash: string;
    [key: string]: any;
}

export function validateTelegramWebAppData(initData: string): ValidatedData | null {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!BOT_TOKEN) {
        console.error("TELEGRAM_BOT_TOKEN is not defined");
        return null;
    }

    if (!initData) {
        return null;
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
        return null;
    }

    urlParams.delete('hash');

    const params: string[] = [];
    urlParams.forEach((val, key) => {
        params.push(`${key}=${val}`);
    });

    // Sort alphabetically
    params.sort();

    const dataCheckString = params.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
        const userDataStr = urlParams.get('user');
        const user = userDataStr ? JSON.parse(userDataStr) : null;
        const auth_date = Number(urlParams.get('auth_date'));

        return {
            ...Object.fromEntries(urlParams),
            user,
            auth_date,
            hash
        } as ValidatedData;
    }

    return null;
}
