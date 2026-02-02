'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Wallet, RefreshCw, Zap, ArrowRightLeft } from 'lucide-react';
import { useTelegram } from '@/components/TelegramProvider';

interface WalletViewProps {
    user: any;
    userToken: string; // Pass token for API calls
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    type: 'text' | 'action_card';
    actionData?: any;
}

export function WalletView({ user, userToken }: WalletViewProps) {
    const { webApp } = useTelegram();
    const [balance, setBalance] = useState<string>('0.00');
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    // Chat State
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: `Hello ${user.first_name || user.username || 'Traveler'}!`, sender: 'agent', type: 'text' },
        { id: '2', text: "I'm your Agent for Arc. I can help you send funds, bridge to Avalanche, or earn yield.", sender: 'agent', type: 'text' }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    // Fetch Balance
    const fetchBalance = async () => {
        setIsLoadingBalance(true);
        try {
            // Using POST as per API definition
            const { data } = await axios.post('/api/circle/wallet/balance', { userToken });

            // Extract USDC balance if available, otherwise just use first
            const usdc = data.balances?.find((b: any) => b.token?.symbol === 'USDC');
            setBalance(usdc?.amount || '0.00');
        } catch (e) {
            console.error("Failed to fetch balance", e);
        } finally {
            setIsLoadingBalance(false);
        }
    };

    useEffect(() => {
        if (userToken) {
            fetchBalance();
        }
        webApp?.expand();
    }, [userToken]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // TODO: Call Agent API here
        setTimeout(() => {
            setIsTyping(false);
            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm processing your request... (Agent Logic Coming Soon)",
                sender: 'agent',
                type: 'text'
            };
            setMessages(prev => [...prev, agentMsg]);
        }, 1200);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
            {/* --- HEADER / WALLET CARD --- */}
            <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-2xl relative overflow-hidden shrink-0 z-10">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet size={120} />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs ring-2 ring-indigo-400">
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="font-bold text-sm">@{user.username || 'user'}</span>
                        </div>
                        <button onClick={fetchBalance} disabled={isLoadingBalance}>
                            <RefreshCw size={16} className={`text-slate-400 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="text-center py-2">
                        <span className="text-4xl font-mono font-bold tracking-tight">${balance}</span>
                        <span className="text-sm text-slate-400 ml-2 font-bold">USDC</span>
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                        <ActionButton icon={<ArrowRightLeft size={18} />} label="Transfer" onClick={() => setInput("I want to send 10 USDC")} />
                        <ActionButton icon={<Zap size={18} />} label="Bridge" onClick={() => setInput("Bridge funds to Avalanche")} />
                        <ActionButton icon={<Wallet size={18} />} label="Earn" onClick={() => setInput("Invest in Savings")} />
                    </div>
                </div>
            </div>

            {/* --- CHAT AREA --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300
                            ${msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100" />
                            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200" />
                        </div>
                    </div>
                )}
            </div>

            {/* --- INPUT AREA --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 pb-8 backdrop-blur-md">
                <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 transition-colors shadow-inner">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a command..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500"
                        enterKeyHint="send"
                    />
                    <button
                        onClick={handleSend}
                        className={`ml-2 p-2 rounded-full transition-all duration-200 ${input.trim() ? 'bg-indigo-600 text-white scale-100' : 'bg-slate-200 text-slate-400 scale-90'}`}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 group-hover:bg-slate-700 group-hover:text-white transition-all shadow-lg group-hover:shadow-indigo-500/20 active:scale-95">
                {icon}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide group-hover:text-slate-200 transition-colors">{label}</span>
        </button>
    );
}
