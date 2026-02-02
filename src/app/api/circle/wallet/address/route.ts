import { NextResponse } from 'next/server';
import { getCircleWallets } from '@/lib/sdk/wallet/server';

export async function POST(request: Request) {
    try {
        const { userToken } = await request.json();

        if (!userToken) {
            return NextResponse.json({ error: 'User Token is required' }, { status: 400 });
        }

        const wallets = await getCircleWallets(userToken);
        const wallet = wallets[0];

        return NextResponse.json({
            address: wallet ? wallet.address : null,
            userId: wallet ? wallet.userId : null
        });
    } catch (error: any) {
        // 404 or other errors mean wallet isn't ready yet
        return NextResponse.json({ address: null });
    }
}
