'use client';

import { useTelegram } from '@/components/TelegramProvider';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Loader2, Send, ArrowDownLeft, RefreshCw, Wallet,
    Scan, Plus, ArrowUpRight, ArrowRightLeft,
    ChevronDown, TrendingUp, History, Coins,
    Settings, ShieldCheck, Sparkles
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

// -- Mock Data for Assets --
const MOCK_ASSETS = [
    { symbol: 'ARC', name: 'Arc Token', amount: '1,432', value: '1,432.00', color: 'bg-indigo-500' },
    { symbol: 'USDC', name: 'USDC', amount: '0.00', value: '0.00', color: 'bg-green-500' },
];

// -- Mock Data for Chart --
const CHART_DATA = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
];

interface WalletData {
    wallet_id: string;
    address: string;
}

interface Balance {
    amount: string;
    token: { symbol: string, name: string };
}

import { useRouter } from 'next/navigation';

export default function Home() {
    const { user, isReady, webApp } = useTelegram();
    const router = useRouter();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [balances, setBalances] = useState<Balance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch Wallet Logic
    const fetchWallet = async (payload: { initData?: string, mockId?: number }) => {
        try {
            setLoading(true);
            const res = await fetch('/api/miniapp/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || data.details || "API Error");
                return;
            }

            if (data.wallet) {
                setWallet(data.wallet);
                setBalances(data.balances || []);
            }
        } catch (error) {
            console.error("Failed to fetch wallet", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isReady && webApp?.initData) {
            console.log("Production Init - fetching wallet...");
            timer = setTimeout(() => fetchWallet({ initData: webApp.initData }), 800);
        } else if (process.env.NODE_ENV === 'development') {
            fetchWallet({ mockId: 123456789 });
        }
        return () => timer && clearTimeout(timer);
    }, [isReady, user, webApp]);

    // Total Balance in USD (Mock + Real USDC)
    const usdcBalance = parseFloat(balances.find(b => b.token.symbol === 'USDC')?.amount || '0.00');
    // Display total formatted
    const totalBalance = usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });


    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#1c1c1e] text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <span className="text-sm text-gray-500 animate-pulse">Initializing Telegram SDK...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#1c1c1e] text-white p-6 text-center">
                <ShieldCheck className="w-12 h-12 text-red-500 mb-4 opacity-50" />
                <h1 className="text-xl font-bold mb-2">Build Configuration Required</h1>
                <p className="text-gray-400 text-sm mb-6 max-w-xs">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-indigo-600 px-6 py-2 rounded-full font-bold active:scale-95 transition-transform"
                >
                    Retry Initialization
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#1c1c1e] text-white font-sans overflow-hidden">

            {/* --- Top Header --- */}
            <header className="px-4 py-3 flex items-center justify-between sticky top-0 bg-[#1c1c1e] z-20 shadow-md shadow-black/20">
                <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-700 ring-2 ring-indigo-500/50">
                        {user?.photo_url ? (
                            <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-indigo-500 to-purple-600">
                                {user?.first_name?.[0] || 'U'}
                            </div>
                        )}
                    </div>
                    {/* Title */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-base font-bold tracking-wide">Arc Wallet</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                        </div>
                        <span className="text-[10px] text-gray-400 -mt-0.5">Agentic Vault</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Network Toggle */}
                    <div className="flex items-center bg-[#2c2c2e] rounded-full px-1 p-0.5 border border-white/5">
                        <span className="px-3 py-1 text-xs font-medium text-gray-400">Network</span>
                        <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full text-white shadow-sm flex items-center gap-1">
                            ARC
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        </span>
                    </div>
                    <Scan className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">

                {/* --- Chart Area (Replaces Progress Ring) --- */}
                <div className="mt-2 h-48 w-full relative">
                    {/* Gradient Overlay for "Premium" feel */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c1e] via-transparent to-[#1c1c1e] z-10 pointer-events-none"></div>

                    <div className="w-full h-full min-h-[192px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={CHART_DATA}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip cursor={false} contentStyle={{ backgroundColor: '#2c2c2e', borderRadius: '12px', borderColor: '#3a3a3c' }} itemStyle={{ color: '#fff' }} />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Centered Total Balance Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                        <span className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">Total Balance</span>
                        <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-2xl">
                            ${totalBalance}
                        </h2>
                        <span className="text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +2.45% Today
                        </span>
                    </div>
                </div>

                {/* --- Quick Actions --- */}
                <div className="grid grid-cols-4 gap-4 px-6 mt-6">
                    {[
                        { icon: Send, label: 'Transfer', color: 'text-indigo-400', bg: 'bg-[#2c2c2e]' },
                        { icon: Plus, label: 'Top Up', color: 'text-indigo-400', bg: 'bg-[#2c2c2e]' },
                        { icon: ArrowUpRight, label: 'Withdraw', color: 'text-indigo-400', bg: 'bg-[#2c2c2e]' },
                        { icon: ArrowRightLeft, label: 'Swap', color: 'text-indigo-400', bg: 'bg-[#2c2c2e]' },
                    ].map((action, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 group">
                            <div className={`w-14 h-14 rounded-2xl ${action.bg} flex items-center justify-center group-hover:bg-[#3a3a3c] active:scale-95 transition-all cursor-pointer shadow-lg shadow-black/20 border border-white/5`}>
                                <action.icon className={`w-6 h-6 ${action.color}`} />
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium group-hover:text-indigo-400 transition-colors">{action.label}</span>
                        </div>
                    ))}
                </div>

                {/* --- Ad Banner --- */}
                <div className="px-4 mt-8">
                    <div className="relative rounded-2xl overflow-hidden h-28 bg-gradient-to-r from-indigo-900 to-purple-900 flex items-center justify-between px-5 shadow-xl border border-white/10 group cursor-pointer">
                        <div className="relative z-10 max-w-[70%]">
                            <div className="flex items-center gap-1 mb-1">
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Agent Opportunity</span>
                            </div>
                            <h3 className="text-white font-bold text-lg leading-tight">Automate your yields with Arc AI</h3>
                            <button
                                onClick={() => router.push('/invest')}
                                className="mt-3 bg-white text-indigo-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                                Activate Now
                            </button>
                        </div>
                        {/* 3D Elements Placeholder */}
                        <div className="relative z-10 transform rotate-12 group-hover:rotate-6 transition-transform duration-500">
                            <Coins className="w-16 h-16 text-indigo-400 opacity-80" />
                        </div>
                    </div>
                </div>

                {/* --- Asset List (Updated Labels) --- */}
                <div className="mt-8">
                    <div className="px-4 py-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Your Assets</span>
                        <Settings className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="space-y-2 px-2">
                        {MOCK_ASSETS.map((asset, i) => (
                            <div key={i} className="px-4 py-3 bg-[#2c2c2e]/50 rounded-xl flex items-center justify-between hover:bg-[#2c2c2e] transition-colors border border-transparent hover:border-white/5 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${asset.color}`}>
                                        {asset.symbol[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">{asset.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <span>{asset.symbol}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-semibold text-white text-sm">{asset.value}</h3>
                                    <p className="text-xs text-gray-500">Balance</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>

            {/* --- Bottom Navigation --- */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e]/90 backdrop-blur-xl border-t border-white/5 px-6 py-2 pb-5 z-20 flex items-center justify-between text-[10px] font-medium text-gray-500">
                <div className="flex flex-col items-center gap-1 text-indigo-500">
                    <Wallet className="w-6 h-6 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <span>Wallet</span>
                </div>
                <div className="flex flex-col items-center gap-1 hover:text-white transition-colors">
                    <TrendingUp className="w-6 h-6" />
                    <span>Market</span>
                </div>
                <div className="flex flex-col items-center gap-1 hover:text-white transition-colors">
                    <Coins className="w-6 h-6" />
                    <span>Earn</span>
                </div>
                <div className="flex flex-col items-center gap-1 hover:text-white transition-colors">
                    <History className="w-6 h-6" />
                    <span>History</span>
                </div>
            </nav>

        </div>
    );
}
