
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export class ArcAgent {
    private model;

    constructor() {
        if (!API_KEY) {
            console.warn("GEMINI_API_KEY is not set. agent will fail.");
            return;
        }
        const genAI = new GoogleGenerativeAI(API_KEY);
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async chat(userMessage: string, history: any[] = []) {
        if (!this.model) {
            return {
                text: "I'm currently offline (Missing API Key). Please configure GEMINI_API_KEY.",
                action: null
            };
        }

        const prompt = `
        You are Arc Agent, an expert DeFi Portfolio Manager.
        Your goal is to help users manage their crypto assets in a Developer-Controlled Wallet.
        
        AVAILABLE STRATEGIES:
        1. "Stable Yield" (ID: stable) -> Circle USYC Vault (5.1% APY, Low Risk).
        2. "Balanced Mix" (ID: balanced) -> 50% USYC + 50% S&P 500 Tokenized (8.5% APY, Medium Risk).
        3. "High Growth" (ID: growth) -> Arc DEX (12-25% APY, High Risk).

        INSTRUCTIONS:
        - Analyze the user's intent.
        - Be professional but concise.
        - If the user seems ready to invest, recommend a specific strategy.
        - ALWAYS return your response in JSON format.
        
        JSON STRUCTURE:
        {
            "text": "Your helpful response here...",
            "action": { "type": "show_card", "strategyId": "stable" } OR null
        }
        
        Action Types:
        - "show_card" (strategyId): To highlight a strategy card.
        - "button" (label): To show a direct execution button (e.g., "Deposit to Safe Vault").

        Current User Message: "${userMessage}"
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean up Markdown code blocks if present
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanJson);
        } catch (error) {
            console.error("AI Error:", error);
            return {
                text: "I'm having trouble analyzing the market right now. Please try again.",
                action: null
            };
        }
    }
}

export const arcAgent = new ArcAgent();
