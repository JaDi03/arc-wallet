
import { NextResponse } from 'next/server';
import { arcAgent } from '@/lib/ai/agent';

export async function POST(request: Request) {
    try {
        const { message, previousMessages } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        const response = await arcAgent.chat(message, previousMessages); // Pass history later

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("Agent API Error:", error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
