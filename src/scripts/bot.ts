
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || '';

if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is missing in .env");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Telegram Bot Started...");

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "🚀 Launch Arc Wallet",
                        web_app: { url: webAppUrl }
                    }
                ]
            ]
        }
    };
    bot.sendMessage(chatId, "Welcome to Arc Wallet! Manage your assets securely with AI Agents.", opts);
});

// Optional: Handle other commands if needed
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, "Click 'Launch Arc Wallet' to open the app.");
});
