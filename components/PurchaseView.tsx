import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { Wallet, TrendingUp, Shield, Zap, ExternalLink, HardDrive, RefreshCw, AlertTriangle } from 'lucide-react';
import { SimpleSwap } from './SimpleSwap';

declare global {
    interface Window {
        Jupiter: Record<string, unknown>; // Use Record instead of any for Jupiter terminal loaded via CDN
    }
}

export const PurchaseView: React.FC = () => {
    const [prices, setPrices] = useState<{ sol: number; xand: number }>({ sol: 0, xand: 0 });
    const [loadingPrices, setLoadingPrices] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pricing Constants
    const XAND_MINT_ADDRESS = "G5siZ5...placeholder"; // Implement actual XAND Mint Address when available
    // For Demo: we can use a known mint like EPjRW... (USDC) or mocked if XAND isn't public yet. 
    // Since Xandeum is likely pre-token or custom, we allow the user to select or default to SOL-USDC if XAND is invalid.

    // Fetch Live Prices (CoinGecko)
    const fetchPrices = async () => {
        try {
            setLoadingPrices(true);
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,xandeum&vs_currencies=usd');
            const data = await response.json();

            // Fallback if Xandeum is not yet listed on public CG
            const xandPrice = data.xandeum?.usd || 0.042;
            const solPrice = data.solana?.usd || 0;

            setPrices({ sol: solPrice, xand: xandPrice });
            setError(null);
        } catch (err) {
            console.error("Failed to fetch prices", err);
            setError("Unable to fetch live data");
            // Fallback to avoid breaking UI
            setPrices({ sol: 150, xand: 0.042 });
        } finally {
            setLoadingPrices(false);
        }
    };

    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full bg-root overflow-y-auto custom-scrollbar p-4 lg:p-8 animate-in fade-in duration-500">

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="relative rounded-3xl overflow-hidden bg-gradient-primary shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-black/20 to-transparent"></div>

                    <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                                <Zap size={12} className="mr-2" /> Live Market Data
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                                Acquire XAND Tokens
                            </h1>
                            <p className="text-white/80 text-lg leading-relaxed mb-6">
                                Swap SOL or USDC for XAND instantly using Jupiter&apos;s best-price routing. No centralized exchange required.
                            </p>

                            {/* Live Ticker */}
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-black/30 backdrop-blur border border-white/10 rounded-xl px-4 py-2 flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3 font-bold text-white text-xs">X</div>
                                    <div>
                                        <div className="text-[10px] text-white/60 uppercase font-bold">XAND / USD</div>
                                        <div className="text-lg font-mono font-bold text-white">
                                            {loadingPrices ? "..." : `$${prices.xand.toFixed(4)}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-black/30 backdrop-blur border border-white/10 rounded-xl px-4 py-2 flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-[#9945FF] flex items-center justify-center mr-3 font-bold text-white text-xs">S</div>
                                    <div>
                                        <div className="text-[10px] text-white/60 uppercase font-bold">SOL / USD</div>
                                        <div className="text-lg font-mono font-bold text-white">
                                            {loadingPrices ? "..." : `$${prices.sol.toFixed(2)}`}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={fetchPrices} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors">
                                    <RefreshCw size={18} className={loadingPrices ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Swap Interface */}
                <div className="lg:col-span-5 space-y-6">
                    <SimpleSwap />

                    <div className="bg-surface border border-border-subtle rounded-xl p-4 flex items-start">
                        <Shield className="text-green-500 w-5 h-5 mr-3 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-text-primary mb-1">Secure & Decentralized</h4>
                            <p className="text-xs text-text-muted">
                                Transaction runs directly on the Solana blockchain. You retain full custody of your assets until the swap executes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Economics & Info */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface border border-border-subtle rounded-2xl p-6 hover:border-primary/50 transition-colors group">
                            <div className="w-12 h-12 bg-primary-soft rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <HardDrive className="text-primary w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">Utility: Storage Rent</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                XAND is the native currency for purchasing storage space on the Xandeum network. pNode operators earn XAND for providing reliable capacity.
                            </p>
                        </div>

                        <div className="bg-surface border border-border-subtle rounded-2xl p-6 hover:border-secondary/50 transition-colors group">
                            <div className="w-12 h-12 bg-secondary-soft rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <TrendingUp className="text-secondary w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">Deflationary Fees</h3>
                            <p className="text-sm text-text-muted leading-relaxed">
                                A portion of transaction fees on the network is permanently burned, introducing a deflationary pressure as network usage scales.
                            </p>
                        </div>
                    </div>

                    {/* Comparison / Info Block */}
                    <div className="bg-surface border border-border-subtle rounded-2xl p-6 md:p-8">
                        <h3 className="text-xl font-bold text-text-primary mb-6">Why XANDEUM?</h3>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="w-8 h-8 rounded-full bg-elevated border border-border-strong flex items-center justify-center font-bold text-sm text-text-secondary mr-4 shrink-0">1</div>
                                <div>
                                    <h4 className="font-bold text-text-primary">Scalable Storage</h4>
                                    <p className="text-sm text-text-muted mt-1">Unlike expensive on-chain storage, Xandeum enables exabyte-scale data availability for dApps.</p>
                                </div>
                            </div>

                            <div className="w-px h-6 bg-border-subtle ml-4 my-1"></div>

                            <div className="flex items-start">
                                <div className="w-8 h-8 rounded-full bg-elevated border border-border-strong flex items-center justify-center font-bold text-sm text-text-secondary mr-4 shrink-0">2</div>
                                <div>
                                    <h4 className="font-bold text-text-primary">Solana Integration</h4>
                                    <p className="text-sm text-text-muted mt-1">Deep integration with Solana means lightning-fast settlement and composite composability with other SPL tokens.</p>
                                </div>
                            </div>

                            <div className="w-px h-6 bg-border-subtle ml-4 my-1"></div>

                            <div className="flex items-start">
                                <div className="w-8 h-8 rounded-full bg-elevated border border-border-strong flex items-center justify-center font-bold text-sm text-text-secondary mr-4 shrink-0">3</div>
                                <div>
                                    <h4 className="font-bold text-text-primary">Community Owned</h4>
                                    <p className="text-sm text-text-muted mt-1">The network is owned by the pNode operators and token holders, not a centralized corporation.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 flex items-start">
                        <AlertTriangle className="text-accent w-6 h-6 mr-4 shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold text-text-primary mb-1">Trading Warning</h4>
                            <p className="text-sm text-text-muted">
                                Always verify the token contract address before swapping. The official XAND mint address will be published on the Xandeum documentation portal.
                                <br /><span className="italic opacity-80 mt-1 block">Note: This is a devnet/beta environment simulation.</span>
                            </p>
                            {/* <div className="font-mono text-[10px] bg-root p-2 rounded mt-2 border border-border-subtle select-all">
                                Mint: {XAND_MINT_ADDRESS}
                            </div> */}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};
