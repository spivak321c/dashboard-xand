import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDown, Info, Loader2, Wallet, RefreshCcw, ExternalLink } from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction, Connection } from '@solana/web3.js';

// --- Constants ---
const HELIUS_RPC_URL = "https://rpc.ankr.com/solana"; // Using Ankr as fallback execution RPC
const XAND_MINT = "G5siZ5...placeholder"; // Replace with real XAND mint
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// --- Types ---
interface QuoteResponse {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    platformFee: unknown;
    priceImpactPct: string;
    routePlan: unknown[];
    contextSlot: number;
    timeTaken: number;
}

export const SimpleSwap: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, signTransaction } = useWallet();

    const [inputToken, setInputToken] = useState<'SOL' | 'USDC'>('SOL');
    const [amount, setAmount] = useState<string>('1.0');
    const [quote, setQuote] = useState<QuoteResponse | null>(null);
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [swapping, setSwapping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // --- Actions ---

    const fetchQuote = useCallback(async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setQuote(null);
            return;
        }

        setLoadingQuote(true);
        setError(null);
        setTxSignature(null);

        try {
            const inputMint = inputToken === 'SOL' ? SOL_MINT : USDC_MINT;
            const outputMint = XAND_MINT; // Always buying XAND

            // Convert amount to integer (Lamports or Micro-USDC)
            // SOL: 9 decimals, USDC: 6 decimals
            const decimals = inputToken === 'SOL' ? 1000000000 : 1000000;
            const amountInt = Math.floor(parseFloat(amount) * decimals);

            const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInt}&slippageBps=50`;

            // NOTE: For demo purposes with invalid XAND Mint, this will fail. 
            // We'll wrap in try/catch and MOCK a success response if API fails on invalid mint.
            // In production with real mint, this just works.

            const response = await fetch(url);
            if (!response.ok) {
                // Fallback for Demo if API 400s on placeholder mint
                throw new Error("Failed to fetch quote (Mint might be invalid)");
            }

            const data = await response.json();
            setQuote(data);
        } catch (err) {
            console.warn("Quote API error:", err);
            // MOCK DATA FOR UI VISUALIZATION
            // Remove this block when XAND mint is real
            // ONLY if we are actually using the placeholder
            if (XAND_MINT.includes("placeholder")) {
                const mockOut = (parseFloat(amount) * (inputToken === 'SOL' ? 25 : 0.4)).toFixed(2); // Mock rate
                setQuote({
                    outAmount: (parseFloat(mockOut) * 1000000).toString(), // Mock 6 decimals
                    priceImpactPct: "0.15",
                    inputMint: inputToken,
                    outputMint: XAND_MINT,
                    inAmount: amount,
                    otherAmountThreshold: "0",
                    swapMode: "ExactIn",
                    slippageBps: 50,
                    platformFee: null,
                    routePlan: [],
                    contextSlot: 0,
                    timeTaken: 0
                } as QuoteResponse);
            } else {
                setQuote(null);
            }
        } finally {
            setLoadingQuote(false);
        }
    }, [amount, inputToken]);

    // Debounce effect for quoting
    useEffect(() => {
        // If placeholder mint, DO NOT call API, use mock immediately to avoid browser errors and delays
        if (XAND_MINT.includes("placeholder")) {
            setLoadingQuote(true);
            const timer = setTimeout(() => {
                const mockOut = (parseFloat(amount || '0') * (inputToken === 'SOL' ? 25 : 0.4)).toFixed(2); // Mock rate
                setQuote({
                    outAmount: (parseFloat(mockOut) * 1000000).toString(),
                    priceImpactPct: "0.15",
                    inputMint: inputToken,
                    outputMint: XAND_MINT,
                    inAmount: amount,
                    otherAmountThreshold: "0",
                    swapMode: "ExactIn",
                    slippageBps: 50,
                    platformFee: null,
                    routePlan: [],
                    contextSlot: 0,
                    timeTaken: 0
                } as QuoteResponse);
                setLoadingQuote(false);
            }, 600);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(fetchQuote, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [fetchQuote, amount, inputToken]);

    const handleSwap = async () => {
        if (!publicKey || !quote) return;

        setSwapping(true);
        setError(null);

        try {
            // 1. Get Serialized Transaction
            const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: publicKey.toString(),
                    wrapAndUnwrapSol: true,
                })
            });

            if (!swapResponse.ok) {
                // If this fails (likely due to mock/placeholder mint), show fake success for demo
                throw new Error("Swap API construction failed");
            }

            const { swapTransaction } = await swapResponse.json();

            // 2. Deserialize & Sign
            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

            // 3. Send
            const signature = await sendTransaction(transaction, connection);

            // 4. Confirm (Optional, just showing link)
            setTxSignature(signature);

        } catch (err) {
            console.error("Swap Error:", err);
            // DEMO SUCCESS FALLBACK
            // If we are in "Mock Mode" because of invalid mints, simulate success
            if (XAND_MINT.includes("placeholder")) {
                setTimeout(() => {
                    setTxSignature("2s3...SimulatedSuccessSignature...x9z");
                    setSwapping(false);
                }, 1500);
                return;
            }
            setError("Swap failed. " + (err instanceof Error ? err.message : ""));
        } finally {
            // Only stop loading if we didn't hit the demo fallback
            if (!XAND_MINT.includes("placeholder")) setSwapping(false);
        }
    };

    // --- Render Helpers ---

    const formatOutAmount = (amtStr?: string) => {
        if (!amtStr) return "0.00";
        // Assuming XAND has 6 decimals? Adjust if 9.
        return (parseInt(amtStr) / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const isMockMode = XAND_MINT.includes("placeholder");

    return (
        <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 group">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-text-primary">Swap Tokens</h2>
                    <p className="text-xs text-text-muted">Best route via Jupiter Aggregator</p>
                </div>
                <div onClick={fetchQuote} className={`p-2 rounded-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${loadingQuote ? 'animate-spin' : ''}`}>
                    <RefreshCcw size={16} className="text-text-muted transition-transform group-hover:rotate-180 duration-700" />
                </div>
            </div>

            {/* Input Section */}
            <div className="space-y-4 relative">

                {/* FROM */}
                <div className="bg-sheet rounded-2xl p-4 border border-border-subtle hover:border-primary/50 transition-colors shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Paying</label>
                        <span className="text-xs text-text-muted flex items-center bg-root px-2 py-0.5 rounded-md border border-border-subtle">
                            <Wallet size={10} className="mr-1" />
                            <span className="opacity-70">Balance:</span> <span className="ml-1 font-mono">--</span>
                        </span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="relative">
                            <select
                                value={inputToken}
                                onChange={(e) => setInputToken(e.target.value as 'SOL' | 'USDC')}
                                className="appearance-none bg-root text-text-primary font-bold rounded-xl pl-3 pr-8 py-2 border border-border-subtle outline-none focus:border-primary cursor-pointer hover:bg-root/80 transition-colors shadow-sm min-w-[100px]"
                            >
                                <option value="SOL">SOL</option>
                                <option value="USDC">USDC</option>
                            </select>
                            <ArrowDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-transparent text-right text-3xl font-mono font-bold text-text-primary outline-none w-full placeholder-text-muted/30"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Arrow Divider */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <div className="bg-sheet border border-border-subtle p-2 rounded-full shadow-lg text-primary transform group-hover:scale-110 transition-transform duration-300">
                        <ArrowDown size={16} strokeWidth={3} />
                    </div>
                </div>

                {/* TO */}
                <div className="bg-sheet rounded-2xl p-4 border border-border-subtle hover:border-secondary/50 transition-colors shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Buying</label>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2 bg-root px-3 py-2 rounded-xl border border-border-subtle shadow-sm min-w-[100px]">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white shadow-md">X</div>
                            <span className="font-bold text-text-primary">XAND</span>
                        </div>
                        <div className="text-right w-full">
                            {loadingQuote ? (
                                <div className="animate-pulse h-9 w-24 bg-text-muted/10 ml-auto rounded"></div>
                            ) : (
                                <div className="text-3xl font-mono font-bold text-primary drop-shadow-sm">
                                    {quote ? formatOutAmount(quote.outAmount) : "0.00"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Info Metrics */}
            {quote && (
                <div className="mt-4 px-2 space-y-2 bg-root/50 p-3 rounded-xl border border-border-subtle/50 animate-in fade-in slide-in-from-top-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-text-muted font-medium">Rate</span>
                        <span className="font-mono text-text-primary font-bold">
                            1 {inputToken} ≈ {formatOutAmount(quote.outAmount)} XAND
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-text-muted font-medium flex items-center">
                            Price Impact <Info size={10} className="ml-1 opacity-50" />
                        </span>
                        <span className={parseFloat(quote.priceImpactPct) > 1 ? "text-red-500 dark:text-red-400 font-bold" : "text-green-600 dark:text-green-400 font-bold"}>
                            {parseFloat(quote.priceImpactPct).toFixed(2)}%
                        </span>
                    </div>
                </div>
            )}

            {/* Errors / Status */}
            {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <Info size={18} className="text-red-500 dark:text-red-400 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-200 font-medium">{error}</p>
                </div>
            )}

            {isMockMode && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-mono text-center flex items-center justify-center gap-2">
                    <Info size={12} />
                    Using Simulated Quote (Devnet Mode)
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleSwap}
                disabled={swapping || loadingQuote || !quote || !publicKey}
                className={`
                    mt-6 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform
                    ${!publicKey
                        ? 'bg-secondary hover:bg-secondary-hover text-white shadow-lg shadow-secondary/25 active:scale-95'
                        : (!quote || loadingQuote
                            ? 'bg-sheet border border-border-subtle text-text-muted cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 hover:-translate-y-0.5 active:scale-95')
                    }
                `}
            >
                {!publicKey ? (
                    <>
                        <Wallet size={20} />
                        Connect Wallet
                    </>
                ) : swapping ? (
                    <>
                        <Loader2 size={24} className="animate-spin" />
                        Confirming...
                    </>
                ) : (
                    "Place Order"
                )}
            </button>

            {/* Success Overlay */}
            {txSignature && (
                <div className="absolute inset-0 bg-surface/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30 animate-bounce-short">
                        <Wallet className="text-white w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-text-primary mb-2">Swap Sent!</h3>
                    <p className="text-text-muted text-sm mb-6 max-w-[200px] leading-relaxed">Your transaction has been submitted to the Solana network.</p>
                    <a
                        href={`https://solana.fm/tx/${txSignature}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-2 bg-root hover:bg-sheet rounded-full text-text-primary font-bold text-sm transition-colors border border-border-subtle shadow-sm flex items-center gap-2 group"
                    >
                        View Explorer <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </a>
                    <button onClick={() => setTxSignature(null)} className="mt-8 text-xs text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest font-bold">
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};
