'use client';

import { useTelegram } from '@/components/TelegramProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, TrendingUp, Zap, Info } from 'lucide-react';

export default function InvestPage() {
    const { user } = useTelegram();
    const router = useRouter();

    const STRATEGIES = [
        {
            id: 'stable',
            name: 'Stable Yield',
            description: 'Safe allocation in Circle USYC (US Treasury backed).',
            apy: '5.1%',
            risk: 'Low',
            icon: ShieldCheck,
            color: 'from-emerald-500 to-teal-500',
            textColor: 'text-emerald-400'
        },
        {
            id: 'balanced',
            name: 'Balanced Mix',
            description: '50% USYC + 50% Tokenized Stocks (S&P 500).',
            apy: '~8.5%',
            risk: 'Medium',
            icon: TrendingUp,
            color: 'from-blue-500 to-indigo-500',
            textColor: 'text-blue-400'
        },
        {
            id: 'growth',
            name: 'High Growth',
            description: 'Aggressive yield farming in Arc DEX pools.',
            apy: '12-25%',
            risk: 'High',
            icon: Zap,
            color: 'from-purple-500 to-pink-500',
            textColor: 'text-purple-400'
        }
    ];

    const [mode, setMode] = useState<'cards' | 'chat'>('cards');
    const [messages, setMessages] = useState([
        { id: 1, sender: 'agent', text: "Hello! I'm Arc Agent. I can help you find the best yield opportunities. Tell me your goal or pick a strategy." }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMsg = { id: Date.now(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            const res = await fetch('/api/miniapp/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.text })
            });
            const data = await res.json();

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'agent',
                text: data.text || "Sorry, I couldn't process that.",
                action: data.action
            }]);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'agent',
                text: "Connection error. Please try again."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#1c1c1e] text-white font-sans">
            {/* Header */}
            <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-[#1c1c1e] z-10 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold">Arc Agent</h1>
                </div>
                {/* Mode Toggle */}
                <div className="flex bg-[#2c2c2e] p-1 rounded-lg">
                    <button
                        onClick={() => setMode('cards')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'cards' ? 'bg-[#3a3a3c] text-white shadow-sm' : 'text-gray-400'}`}
                    >
                        Strategies
                    </button>
                    <button
                        onClick={() => setMode('chat')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'chat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'}`}
                    >
                        Chat
                    </button>
                </div>
            </header>

            <main className="flex-1 px-4 py-4 flex flex-col h-[calc(100vh-80px)]">

                {mode === 'cards' ? (
                    // --- CARDS VIEW ---
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                Assign an Objective
                            </h2>
                            <p className="text-gray-400 text-sm">
                                Set your goal. Arc Agent will autonomously navigate DeFi protocols to execute the best strategy for you, 24/7.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {STRATEGIES.map((strategy) => (
                                <motion.div
                                    key={strategy.id}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-[#2c2c2e] rounded-2xl p-0.5 overflow-hidden group cursor-pointer relative"
                                >
                                    <div className="relative bg-[#2c2c2e] rounded-[15px] p-5 h-full border border-white/5 hover:border-indigo-500/30 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${strategy.color} flex items-center justify-center text-white shadow-lg`}>
                                                <strategy.icon className="w-6 h-6" />
                                            </div>
                                            <div className="text-right">
                                                <span className={`block text-xl font-bold ${strategy.textColor}`}>
                                                    {strategy.apy} <span className="text-xs text-gray-500 font-normal">APY</span>
                                                </span>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/5 ${strategy.textColor}`}>
                                                    {strategy.risk} Risk
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1">{strategy.name}</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            {strategy.description}
                                        </p>

                                        <button className="mt-4 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-semibold transition-all group-hover:bg-white group-hover:text-black">
                                            Activate Agent
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // --- CHAT VIEW ---
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide pb-4">
                            {messages.map((msg: any) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                                        : 'bg-[#2c2c2e] text-gray-200 rounded-tl-sm border border-white/5'
                                        }`}>
                                        <p>{msg.text}</p>

                                        {/* Optional Action Button in Chat */}
                                        {msg.action?.type === 'button' && (
                                            <button className="mt-3 w-full py-2 bg-white text-black font-bold rounded-lg text-xs hover:bg-gray-200 transition-colors">
                                                {msg.action.label}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-[#2c2c2e] rounded-2xl px-4 py-3 rounded-tl-sm border border-white/5 flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="pt-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask Arc Agent..."
                                    className="w-full bg-[#2c2c2e] text-white border border-white/10 rounded-full py-3 pl-4 pr-12 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-500 text-sm"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className={`absolute right-1.5 top-1.5 p-1.5 rounded-full ${inputValue.trim() ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                >
                                    <ArrowLeft className="w-4 h-4 transform rotate-90" /> {/* Send Icon Mock */}
                                </button>
                            </div>

                            {/* Dev Helper: Simulate Proactive Alert */}
                            <button 
                                onClick={() => {
                                    setMessages(prev => [...prev, {
                                        id: Date.now(),
                                        sender: 'agent',
                                        text: "🚨 WAKE UP! Market Alert: A new 'Arc Flash Pool' just opened with 12.5% APY (vs your current 5.1%). Gas is covered by Circle. Switch now?",
                                        action: { type: 'button', label: '🚀 Yes, Switch Instantly (0 Fees)' }
                                    }]);
                                }}
                                className="mt-4 py-2 text-xs font-bold text-yellow-500 bg-yellow-500/10 rounded-lg w-full text-center border border-yellow-500/20 hover:bg-yellow-500/20 transition-all"
                            >
                                🔔 Tap to Simulate "Wake Up" Alert
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
