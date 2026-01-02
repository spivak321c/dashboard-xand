import React, { useState, useEffect, useMemo } from 'react';
import {
    Calculator, Server, HardDrive, ShieldCheck, ShieldAlert, Layers,
    Database, AlertCircle, TrendingUp, DollarSign, Clock, Minus, Plus,
    Info, BarChart3, Play, Pause, RotateCcw, Activity, CheckCircle2,
    XCircle, Anchor, Key, Cpu, Settings2, Coins, Users, Zap, HelpCircle,
    Gem
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area, CartesianGrid
} from 'recharts';

export const StoragePlannerView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'calculator' | 'simulator'>('calculator');

    return (
        <div className="h-full flex flex-col bg-root overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
            {/* Navigation Tabs */}
            <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-border-subtle px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-text-primary flex items-center">
                    <Calculator className="w-6 h-6 mr-3 text-primary" />
                    Storage Planner
                </h1>
                <div className="flex bg-root p-1 rounded-lg border border-border-subtle">
                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'calculator' ? 'bg-surface text-primary shadow-sm border border-border-subtle' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        Cost & ROI Calculator
                    </button>
                    <button
                        onClick={() => setActiveTab('simulator')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'simulator' ? 'bg-surface text-secondary shadow-sm border border-border-subtle' : 'text-text-muted hover:text-text-primary'}`}
                    >
                        Redundancy Simulator
                    </button>
                </div>
            </div>

            <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1">
                {activeTab === 'calculator' ? <CostCalculator /> : <RedundancySimulator />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: COST CALCULATOR ---
import { useCalculator } from '../hooks/useCalculator';

const CostCalculator = () => {
    // --- 1. STORAGE COST ESTIMATOR STATE (Consumer) ---
    const [dataSizeTB, setDataSizeTB] = useState<number>(1);
    const [storageDuration, setStorageDuration] = useState<number>(12);
    const [accessFrequency, setAccessFrequency] = useState<'frequent' | 'infrequent' | 'archive'>('frequent');
    const [egressGB, setEgressGB] = useState<number>(100);
    const [opsCount, setOpsCount] = useState<number>(10000); // per month

    // Provider Rates (Proxied for Dec 2025)
    const rates = {
        aws: { storage: 23, egress: 0.09, ops: 0.005 }, // per 10k ops
        filecoin: { storage: 2.27, egress: 0.01, ops: 0.001 },
        storj: { storage: 4, egress: 0.007, ops: 0.000 },
        arweave: { storage: 11000, egress: 0, ops: 0 }, // one-time fee per TB (approx $11/GB)
        xandeum: { storage: 2.50, egress: 0.005, ops: 0.0005 } // Proxying competitive rates
    };

    const calculateTotalCost = (provider: keyof typeof rates, isPermanent: boolean = false) => {
        const r = rates[provider];
        if (isPermanent && provider === 'arweave') return r.storage * dataSizeTB;

        const monthlyBase = r.storage * dataSizeTB;
        const monthlyEgress = r.egress * egressGB;
        const monthlyOps = (opsCount / 10000) * r.ops;

        const tierMultiplier = accessFrequency === 'archive' ? 0.2 : accessFrequency === 'infrequent' ? 0.5 : 1;
        const totalMonthly = (monthlyBase * tierMultiplier) + monthlyEgress + monthlyOps;

        return totalMonthly * storageDuration;
    };

    const costComparisonData = [
        { name: 'AWS S3', cost: calculateTotalCost('aws') },
        { name: 'Filecoin', cost: calculateTotalCost('filecoin') },
        { name: 'Storj', cost: calculateTotalCost('storj') },
        { name: 'Xandeum', cost: calculateTotalCost('xandeum'), isXand: true },
        { name: 'Arweave', cost: calculateTotalCost('arweave', true), isOneTime: true }
    ].sort((a, b) => a.cost - b.cost);

    // --- 2. pNODE ROI CALCULATOR STATE (Provider) ---
    const [numNodes, setNumNodes] = useState<number>(1);
    const [storagePerNodeGB, setStoragePerNodeGB] = useState<number>(1024);
    const [perfScore, setPerfScore] = useState<number>(0.95);
    const [ownStake, setOwnStake] = useState<number>(10000);
    const [delegatedStake, setDelegatedStake] = useState<number>(100000);
    const [commissionRate, setCommissionRate] = useState<number>(5);
    const [nftBoost, setNftBoost] = useState<number>(1);
    const [eraBoost, setEraBoost] = useState<number>(16);
    const [annualNetworkRevenue, setAnnualNetworkRevenue] = useState<number>(15000000);
    const [totalNetworkNodes, setTotalNetworkNodes] = useState<number>(500);
    const [epochLengthDays, setEpochLengthDays] = useState<number>(2.1);
    const [xandPrice, setXandPrice] = useState<number>(0.045);
    const [monthlyOpCost, setMonthlyOpCost] = useState<number>(10);
    const [initialSetupCost, setInitialSetupCost] = useState<number>(500);
    const [hardwareCost, setHardwareCost] = useState<number>(1200);

    // ROI Calculations Logic (Same as previous version)
    const totalNodeStake = ownStake + delegatedStake;
    const creditsPerEpoch = useMemo(() => {
        if (ownStake === 0) return 0;
        return numNodes * storagePerNodeGB * perfScore * (totalNodeStake / 1000);
    }, [numNodes, storagePerNodeGB, perfScore, ownStake, totalNodeStake]);

    const totalNetworkCredits = totalNetworkNodes * 1024 * 0.9 * (200000 / 1000);
    const epochShare = creditsPerEpoch / (totalNetworkCredits + creditsPerEpoch);
    const epochsPerYear = 365 / epochLengthDays;
    const annualNetRevenue = annualNetworkRevenue * 0.94;
    const annualVariableEarningsUSD = annualNetRevenue * epochShare;
    const annualVariableEarningsXAND = annualVariableEarningsUSD / xandPrice;
    const boostMultiplier = nftBoost * eraBoost;
    const boostedVariableEarningsXAND = annualVariableEarningsXAND * boostMultiplier;
    const boostedVariableEarningsUSD = boostedVariableEarningsXAND * xandPrice;
    const delegatedRewardsXAND = (boostedVariableEarningsXAND * (delegatedStake / Math.max(1, totalNodeStake)));
    const commissionEarningsXAND = delegatedRewardsXAND * (commissionRate / 100);
    const commissionEarningsUSD = commissionEarningsXAND * xandPrice;
    const fixedMonthlyXAND = 10000;
    const annualFixedXAND = fixedMonthlyXAND * 12;
    const annualFixedUSD = annualFixedXAND * xandPrice;
    const totalAnnualEarningsUSD = boostedVariableEarningsUSD + commissionEarningsUSD + annualFixedUSD;
    const totalAnnualEarningsXAND = totalAnnualEarningsUSD / xandPrice;
    const totalInitialInvestment = initialSetupCost + hardwareCost;
    const totalAnnualOpCost = monthlyOpCost * 12;
    const netAnnualProfitUSD = totalAnnualEarningsUSD - totalAnnualOpCost;
    const annualROI = (netAnnualProfitUSD / Math.max(1, totalInitialInvestment)) * 100;
    const breakEvenMonths = totalInitialInvestment / Math.max(0.01, (totalAnnualEarningsUSD / 12) - monthlyOpCost);

    const chartData = useMemo(() => {
        return Array.from({ length: 13 }, (_, i) => ({
            month: i === 0 ? 'Start' : `M${i}`,
            cost: Math.round(totalInitialInvestment + (monthlyOpCost * i)),
            earnings: Math.round((totalAnnualEarningsUSD / 12) * i),
        }));
    }, [totalInitialInvestment, monthlyOpCost, totalAnnualEarningsUSD]);

    const isZero = ownStake === 0 || storagePerNodeGB < 256;

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-4">

            {/* SECTION 1: STORAGE COST ESTIMATOR (CONSUMER) */}
            <div className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Database size={120} className="text-primary" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight flex items-center">
                            <DollarSign className="w-7 h-7 mr-3 text-primary" />
                            Storage Cost Estimator
                        </h2>
                        <p className="text-sm text-text-muted mt-1">Compare Xandeum vs. Cloud & Web3 storage providers.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setDataSizeTB(100); setStorageDuration(36); setAccessFrequency('archive'); }} className="px-3 py-1.5 bg-root rounded-lg border border-border-subtle text-[10px] font-bold uppercase hover:text-primary transition-colors">Archival Preset</button>
                        <button onClick={() => { setDataSizeTB(5); setStorageDuration(12); setAccessFrequency('frequent'); setEgressGB(500); }} className="px-3 py-1.5 bg-root rounded-lg border border-border-subtle text-[10px] font-bold uppercase hover:text-primary transition-colors">App Preset</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                    {/* Controls */}
                    <div className="lg:col-span-4 space-y-7">
                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase mb-2">
                                <label className="text-text-muted">Data Volume</label>
                                <span className="text-primary font-mono">{dataSizeTB} TB</span>
                            </div>
                            <input
                                type="range" min="1" max="1000" step="1"
                                value={dataSizeTB} onChange={(e) => setDataSizeTB(Number(e.target.value))}
                                className="w-full h-1.5 bg-border-strong rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase mb-2">
                                <label className="text-text-muted">Duration</label>
                                <span className="text-primary font-mono">{storageDuration} Months</span>
                            </div>
                            <input
                                type="range" min="1" max="60" step="1"
                                value={storageDuration} onChange={(e) => setStorageDuration(Number(e.target.value))}
                                className="w-full h-1.5 bg-border-strong rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Egress (GB/mo)</label>
                                <input type="number" value={egressGB} onChange={(e) => setEgressGB(parseInt(e.target.value) || 0)} className="w-full bg-root border border-border-strong rounded-lg p-2 text-sm font-mono font-bold outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Tier</label>
                                <select value={accessFrequency} onChange={(e) => setAccessFrequency(e.target.value as 'frequent' | 'infrequent' | 'archive')} className="w-full bg-root border border-border-strong rounded-lg p-2 text-xs font-bold outline-none focus:border-primary">
                                    <option value="frequent">Standard / Hot</option>
                                    <option value="infrequent">Infrequent / Cool</option>
                                    <option value="archive">Archive / Cold</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Chart & Results */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="h-48 bg-root/30 rounded-2xl p-4 border border-border-subtle">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={costComparisonData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--overlay-hover)' }}
                                        contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)', fontSize: '11px' }}
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Estimate']}
                                    />
                                    <Bar dataKey="cost" barSize={14} radius={[0, 4, 4, 0]}>
                                        {costComparisonData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.isXand ? 'var(--color-primary)' : entry.isOneTime ? 'var(--color-accent)' : 'var(--border-strong)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                                <div className="text-[10px] font-bold text-primary uppercase mb-1">Xandeum Total</div>
                                <div className="text-xl font-black text-text-primary font-mono">${calculateTotalCost('xandeum').toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            </div>
                            <div className="bg-elevated border border-border-subtle rounded-xl p-4 text-center">
                                <div className="text-[10px] font-bold text-text-muted uppercase mb-1">AWS S3 Total</div>
                                <div className="text-xl font-black text-text-primary font-mono">${calculateTotalCost('aws').toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            </div>
                            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
                                <div className="text-[10px] font-bold text-accent uppercase mb-1">One-Time Fee</div>
                                <div className="text-xl font-black text-text-primary font-mono">${calculateTotalCost('arweave', true).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            </div>
                        </div>
                        <p className="text-[9px] text-text-muted italic text-center">Calculations include storage, egress, and approximate operations fees. Arweave estimates are based on permanent storage.</p>
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent opacity-50"></div>

            {/* SECTION 2: pNODE ROI CALCULATOR (PROVIDER) */}
            <div className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Server size={120} className="text-secondary" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight flex items-center">
                            <Cpu className="w-7 h-7 mr-3 text-secondary" />
                            pNode ROI Simulator
                        </h2>
                        <p className="text-sm text-text-muted mt-1">Estimate earnings and profitability for storage providers.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-secondary/10 rounded-lg border border-secondary/20 text-[10px] font-black text-secondary flex items-center">
                            <Clock size={12} className="mr-2" />
                            {breakEvenMonths.toFixed(1)} MO PAYBACK
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                    {/* Controls */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Number of pNodes</label>
                                <div className="flex items-center bg-root border border-border-strong rounded-lg p-1">
                                    <button onClick={() => setNumNodes(Math.max(1, numNodes - 1))} className="p-2 hover:text-secondary transition-colors"><Minus size={14} /></button>
                                    <input type="number" value={numNodes} onChange={(e) => setNumNodes(parseInt(e.target.value) || 1)} className="w-full bg-transparent text-center text-sm font-mono font-bold outline-none" />
                                    <button onClick={() => setNumNodes(numNodes + 1)} className="p-2 hover:text-secondary transition-colors"><Plus size={14} /></button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Capacity (GB)</label>
                                <input type="number" min="256" value={storagePerNodeGB} onChange={(e) => setStoragePerNodeGB(parseInt(e.target.value) || 256)} className="w-full bg-root border border-border-strong rounded-lg p-2.5 text-sm font-mono font-bold outline-none focus:border-secondary transition-colors" />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Perf Score</label>
                                <span className="text-xs font-mono font-bold text-secondary">{perfScore.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0.5" max="1" step="0.01" value={perfScore} onChange={(e) => setPerfScore(parseFloat(e.target.value))} className="w-full h-1.5 bg-border-strong rounded-lg appearance-none cursor-pointer accent-secondary" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Own Staked XAND</label>
                                <input type="number" value={ownStake} onChange={(e) => setOwnStake(parseInt(e.target.value) || 0)} className="w-full bg-root border border-border-strong rounded-lg p-2.5 text-sm font-mono font-bold outline-none focus:border-secondary" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Delegated (XAND)</label>
                                <input type="number" value={delegatedStake} onChange={(e) => setDelegatedStake(parseInt(e.target.value) || 0)} className="w-full bg-root border border-border-strong rounded-lg p-2.5 text-sm font-mono font-bold outline-none focus:border-secondary" />
                            </div>
                        </div>

                        {/* Commission & Boosts */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Comm. %</label>
                                <input
                                    type="number" max="100"
                                    value={commissionRate}
                                    onChange={(e) => setCommissionRate(Math.min(100, parseInt(e.target.value) || 0))}
                                    className="w-full bg-root border border-border-strong rounded-lg p-2.5 text-sm font-mono font-bold outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">NFT Boost</label>
                                <select
                                    value={nftBoost}
                                    onChange={(e) => setNftBoost(parseFloat(e.target.value))}
                                    className="w-full bg-root border border-border-strong rounded-lg p-2.5 text-xs font-bold outline-none focus:border-primary"
                                >
                                    <option value="1">None (1x)</option>
                                    <option value="1.5">Rabbit (1.5x)</option>
                                    <option value="2.5">Silver (2.5x)</option>
                                    <option value="11">Titan (11x)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Era Boost</label>
                                <select
                                    value={eraBoost}
                                    onChange={(e) => setEraBoost(parseFloat(e.target.value))}
                                    className="w-full bg-root border border-border-strong rounded-lg p-2.5 text-xs font-bold outline-none focus:border-primary"
                                >
                                    <option value="1">Genesis (1x)</option>
                                    <option value="16">Deep South (16x)</option>
                                </select>
                            </div>
                        </div>

                        {/* Costs & Network */}
                        <div className="p-4 bg-root/50 rounded-2xl border border-border-subtle border-dashed space-y-4">

                            {/* Costs Header & Token Price */}
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Pricing & Costs (USD)</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-text-muted">XAND:</span>
                                    <input
                                        type="number" step="0.001"
                                        value={xandPrice}
                                        onChange={(e) => setXandPrice(parseFloat(e.target.value))}
                                        className="w-16 bg-surface border border-border-subtle rounded px-1 text-[9px] font-mono font-bold text-right"
                                    />
                                </div>
                            </div>

                            {/* Cost Inputs */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[8px] font-bold text-text-muted uppercase mb-1 block">Mo. Ops ($)</label>
                                    <input type="number" value={monthlyOpCost} onChange={(e) => setMonthlyOpCost(parseFloat(e.target.value) || 0)} className="w-full bg-surface border border-border-subtle rounded-md p-2 text-xs font-mono font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-text-muted uppercase mb-1 block">Setup/NFT ($)</label>
                                    <input type="number" value={initialSetupCost} onChange={(e) => setInitialSetupCost(parseFloat(e.target.value) || 0)} className="w-full bg-surface border border-border-subtle rounded-md p-2 text-xs font-mono font-bold outline-none" />
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-text-muted uppercase mb-1 block">Hardware ($)</label>
                                    <input type="number" value={hardwareCost} onChange={(e) => setHardwareCost(parseFloat(e.target.value) || 0)} className="w-full bg-surface border border-border-subtle rounded-md p-2 text-xs font-mono font-bold outline-none" />
                                </div>
                            </div>

                            <div className="w-full h-px bg-border-subtle/50"></div>

                            {/* Network Assumptions */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Network Assumptions</h4>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setAnnualNetworkRevenue(5000000); setTotalNetworkNodes(200); }} className="text-[8px] px-2 py-0.5 bg-surface rounded border border-border-subtle opacity-60 hover:opacity-100 transition-opacity">Low</button>
                                        <button onClick={() => { setAnnualNetworkRevenue(15000000); setTotalNetworkNodes(500); }} className="text-[8px] px-2 py-0.5 bg-surface rounded border border-border-subtle opacity-80 hover:opacity-100 transition-opacity">Med</button>
                                        <button onClick={() => { setAnnualNetworkRevenue(45000000); setTotalNetworkNodes(2000); }} className="text-[8px] px-2 py-0.5 bg-surface rounded border border-border-subtle hover:opacity-100 transition-opacity">High</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[8px] font-bold text-text-muted uppercase mb-1 block">Ann. Rev ($)</label>
                                        <input type="number" value={annualNetworkRevenue} onChange={(e) => setAnnualNetworkRevenue(parseFloat(e.target.value))} className="w-full bg-surface border border-border-subtle rounded-md p-2 text-xs font-mono font-bold outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-bold text-text-muted uppercase mb-1 block">Tot. Nodes</label>
                                        <input type="number" value={totalNetworkNodes} onChange={(e) => setTotalNetworkNodes(parseInt(e.target.value))} className="w-full bg-surface border border-border-subtle rounded-md p-2 text-xs font-mono font-bold outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-bold text-text-muted uppercase mb-1 block">Epoch (d)</label>
                                        <input type="number" step="0.1" value={epochLengthDays} onChange={(e) => setEpochLengthDays(parseFloat(e.target.value))} className="w-full bg-surface border border-border-subtle rounded-md p-2 text-xs font-mono font-bold outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Outputs */}
                    <div className="lg:col-span-7 space-y-6">
                        {isZero && (
                            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 flex items-center gap-4 text-accent font-bold text-xs">
                                <AlertCircle size={18} /> Stake required to activate earnings.
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-root/30 border border-border-subtle rounded-2xl p-6">
                                <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Annual Earnings</div>
                                <div className="text-3xl font-black text-text-primary">${totalAnnualEarningsUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                <div className="text-[10px] font-mono text-secondary mt-1 tracking-wider">{totalAnnualEarningsXAND.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAND</div>
                            </div>
                            <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-6">
                                <div className="text-[10px] font-bold text-secondary uppercase mb-1">Annual ROI</div>
                                <div className="text-3xl font-black text-secondary">{annualROI.toFixed(1)}%</div>
                                <div className="text-[10px] font-mono text-text-muted mt-1 uppercase">Net Profitability</div>
                            </div>
                        </div>

                        <div className="bg-root/50 rounded-2xl p-6 border border-border-subtle">
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-6 flex items-center">
                                <BarChart3 className="w-3.5 h-3.5 mr-2" /> Yield Ramp Projection
                            </h3>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                        <Area type="monotone" dataKey="earnings" stroke="var(--color-secondary)" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between mt-4">
                                <div className="flex items-center text-[10px] text-text-muted">
                                    <Info size={12} className="mr-1.5" />
                                    Investment: ${totalInitialInvestment.toLocaleString()}
                                </div>
                                <div className="flex items-center text-[10px] text-text-muted">
                                    Commission: {commissionRate}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper
const isInfinity = (val: number) => !isFinite(val);

// --- SUB-COMPONENT: REDUNDANCY SIMULATOR ---

interface SimNode {
    id: number;
    status: 'healthy' | 'failed' | 'repairing';
    shards: number[];
}

const createInitialNodes = (total: number, k: number, m: number): SimNode[] => {
    const initialNodes: SimNode[] = Array.from({ length: total }, (_, i) => ({
        id: i,
        status: 'healthy',
        shards: [] as number[]
    }));

    const totalShards = k + m;
    for (let s = 0; s < totalShards; s++) {
        const nodeIdx = s % total;
        initialNodes[nodeIdx].shards.push(s);
    }
    return initialNodes;
};

const RedundancySimulator = () => {
    // 1. INPUT STATE
    const [fileSizeMB, setFileSizeMB] = useState<number>(100);
    const [totalNodes, setTotalNodes] = useState<number>(12);
    const [redundancyK, setRedundancyK] = useState<number>(6); // Data Shards
    const [redundancyM, setRedundancyM] = useState<number>(4); // Parity Shards (Tolerates M failures)
    const [failureRate, setFailureRate] = useState<number>(20); // % chance per step or annual
    const [repairThreshold, setRepairThreshold] = useState<number>(80); // % of total (k+m)
    const [challengeFreq, setChallengeFreq] = useState<number>(5); // Every X steps
    const [enableTSS, setEnableTSS] = useState<boolean>(true);
    const [enableAnchoring, setEnableAnchoring] = useState<boolean>(true);

    // 2. SIMULATION STATE
    const [nodes, setNodes] = useState<SimNode[]>(() => createInitialNodes(totalNodes, redundancyK, redundancyM));
    const [simStep, setSimStep] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [lastEvent, setLastEvent] = useState<string>("Simulator ready.");
    const [stats, setStats] = useState({ recovered: 0, totalRuns: 0, anchoredEvents: 0 });

    // Parameter tracking for reset
    const [prevParams, setPrevParams] = useState({ totalNodes, redundancyK, redundancyM });

    // Handle parameter changes during render (React recommended pattern)
    if (totalNodes !== prevParams.totalNodes ||
        redundancyK !== prevParams.redundancyK ||
        redundancyM !== prevParams.redundancyM) {

        setPrevParams({ totalNodes, redundancyK, redundancyM });
        setNodes(createInitialNodes(totalNodes, redundancyK, redundancyM));
        setSimStep(0);
        setLastEvent("System initialized with " + (redundancyK + redundancyM) + " shards.");
    }

    // Simulation Loop
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setSimStep(prev => prev + 1);

                setNodes(currentNodes => {
                    const nextNodes = currentNodes.map(node => ({ ...node }));
                    let event = "";

                    // 1. Random Failures 
                    nextNodes.forEach(node => {
                        if (node.status === 'healthy' && Math.random() < (failureRate / 100) * 0.1) {
                            node.status = 'failed';
                            event = `Node ${node.id} failed!`;
                        }
                    });

                    // 2. Self-Repair Check
                    const totalShards = redundancyK + redundancyM;
                    const healthyNodes = nextNodes.filter(n => n.status === 'healthy');
                    const activeShardsCount = nextNodes.reduce((acc, n) => {
                        if (n.status === 'healthy') return acc + n.shards.length;
                        return acc;
                    }, 0);

                    const healthPercent = (activeShardsCount / totalShards) * 100;

                    if (healthPercent < repairThreshold && healthyNodes.length > 0) {
                        const failedNodes = nextNodes.filter(n => n.status === 'failed');
                        if (failedNodes.length > 0) {
                            const repairIdx = Math.floor(Math.random() * failedNodes.length);
                            const targetNode = failedNodes[repairIdx];
                            targetNode.status = 'repairing';
                            event = `Initiating self-repair on Node ${targetNode.id}...`;

                            // Simulate repair completion
                            setTimeout(() => {
                                setNodes(prev => prev.map(n =>
                                    n.id === targetNode.id ? { ...n, status: 'healthy' } : n
                                ));
                                setLastEvent(`Redundancy restored on Node ${targetNode.id}.`);
                            }, 1500);
                        }
                    }

                    if (event) setLastEvent(event);
                    return nextNodes;
                });

                // Challenges & Anchoring
                if (simStep % challengeFreq === 0) {
                    if (enableAnchoring) setStats(s => ({ ...s, anchoredEvents: s.anchoredEvents + 1 }));
                    setLastEvent("PoST Challenge issued. Integrity verified via " + (enableTSS ? "TSS" : "Direct Check") + ".");
                }

            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isRunning, simStep, failureRate, repairThreshold, challengeFreq, redundancyK, redundancyM, enableTSS, enableAnchoring]);

    // Derived Stats
    const totalActiveShards = useMemo(() => {
        const shards = new Set<number>();
        nodes.forEach(n => {
            if (n.status !== 'failed') n.shards.forEach(s => shards.add(s));
        });
        return shards.size;
    }, [nodes]);

    const isRecoverable = totalActiveShards >= redundancyK;
    const recoveryProgress = (totalActiveShards / (redundancyK + redundancyM)) * 100;

    const resetSim = () => {
        setIsRunning(false);
        setSimStep(0);
        setStats({ recovered: 0, totalRuns: 0, anchoredEvents: 0 });
        const resetNodes = nodes.map(n => ({ ...n, status: 'healthy' as const } as SimNode));
        setNodes(resetNodes);
        setLastEvent("Simulator reset.");
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="bg-surface border border-border-subtle rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Layers size={140} className="text-accent" />
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tight flex items-center">
                            <Activity className="w-7 h-7 mr-3 text-accent" />
                            Redundancy Protocol Simulator
                        </h2>
                        <p className="text-sm text-text-muted mt-1">
                            Erasure Coding: <span className="font-mono text-accent font-bold">{redundancyK}+{redundancyM}</span> - Tolerate {redundancyM} concurrent failures.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center px-4 py-2 rounded-xl font-bold text-sm transition-all ${isRunning ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}>
                            {isRunning ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                            {isRunning ? 'PAUSE' : 'START SIM'}
                        </button>
                        <button onClick={resetSim} className="p-2 bg-root rounded-xl border border-border-subtle hover:text-primary transition-colors">
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                    {/* Controls Panel */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-root/50 rounded-2xl p-6 border border-border-subtle space-y-6">
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center">
                                <Plus size={12} className="mr-2" /> Parameters
                            </h3>

                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                                    <label className="text-text-muted">File Size</label>
                                    <span className="text-accent font-mono">{fileSizeMB} MB</span>
                                </div>
                                <input type="range" min="1" max="1000" step="10" value={fileSizeMB} onChange={(e) => setFileSizeMB(parseInt(e.target.value))} className="w-full h-1 bg-border-strong rounded-lg appearance-none cursor-pointer accent-accent" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-text-muted uppercase mb-1 block">pNodes</label>
                                    <input type="number" min="5" max="50" value={totalNodes} onChange={(e) => setTotalNodes(parseInt(e.target.value) || 5)} className="w-full bg-surface border border-border-strong rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-accent" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-text-muted uppercase mb-1 block">Fault Tol. (m)</label>
                                    <input type="number" min="1" max="10" value={redundancyM} onChange={(e) => setRedundancyM(parseInt(e.target.value) || 1)} className="w-full bg-surface border border-border-strong rounded-lg p-2 text-xs font-mono font-bold outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                                    <label className="text-text-muted">Failure Rate</label>
                                    <span className="text-red-400 font-mono">{failureRate}%</span>
                                </div>
                                <input type="range" min="0" max="50" step="5" value={failureRate} onChange={(e) => setFailureRate(parseInt(e.target.value))} className="w-full h-1 bg-border-strong rounded-lg appearance-none cursor-pointer accent-red-400" />
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={enableTSS} onChange={(e) => setEnableTSS(e.target.checked)} className="w-4 h-4 rounded border-border-subtle text-accent focus:ring-accent" />
                                    <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">Enable TSS Integrity Checks</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={enableAnchoring} onChange={(e) => setEnableAnchoring(e.target.checked)} className="w-4 h-4 rounded border-border-subtle text-accent focus:ring-accent" />
                                    <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">Anchor to Solana Ledger</span>
                                </label>
                            </div>
                        </div>

                        {/* Event Logger */}
                        <div className="bg-black/20 rounded-2xl p-4 border border-border-subtle h-32 overflow-hidden flex flex-col font-mono">
                            <div className="text-[9px] text-text-muted flex items-center justify-between mb-2">
                                <span className="flex items-center"><Activity size={10} className="mr-1" /> SYSTEM_LOG</span>
                                <span>STEP: {simStep}</span>
                            </div>
                            <div className="flex-1 text-[11px] text-accent/80 leading-relaxed animate-in fade-in slide-in-from-left-2 duration-300">
                                {">"} {lastEvent}
                            </div>
                        </div>
                    </div>

                    {/* Simulation Visualization */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Shard Grid */}
                        <div className="relative bg-root/30 rounded-3xl border border-border-subtle p-8 overflow-hidden min-h-[350px]">
                            {/* SVG layer for animations (simulated with CSS grid) */}
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 relative z-10">
                                {nodes.map((node) => (
                                    <div key={node.id} className="group relative">
                                        <div className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 relative ${node.status === 'failed' ? 'bg-red-500/10 border-red-500/40 text-red-500/50 grayscale' :
                                            node.status === 'repairing' ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500 animate-pulse' :
                                                'bg-surface border-border-subtle text-text-muted hover:border-accent hover:shadow-lg hover:shadow-accent/5'
                                            }`}>
                                            <Cpu size={20} className={node.status === 'healthy' ? 'text-text-muted/40' : ''} />
                                            <span className="text-[8px] font-black mt-1 uppercase">pNode {node.id}</span>

                                            {/* Shard Indicators */}
                                            <div className="flex gap-1 mt-1.5">
                                                {node.shards.map(s => (
                                                    <div key={s} className={`w-1.5 h-1.5 rounded-full ${node.status === 'healthy' ? 'bg-accent shadow-[0_0_8px_var(--color-accent)]' : 'bg-current opacity-20'}`} />
                                                ))}
                                            </div>

                                            {/* TSS badge */}
                                            {enableTSS && node.status === 'healthy' && simStep % challengeFreq === 1 && (
                                                <div className="absolute -top-1 -right-1 bg-accent text-root font-black text-[7px] px-1 rounded animate-bounce">TSS</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Solana Anchor Indicators */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                                {Array.from({ length: stats.anchoredEvents % 20 }).map((_, i) => (
                                    <div key={i} className="w-1 h-1 bg-secondary rounded-full animate-ping" />
                                ))}
                            </div>
                        </div>

                        {/* Recovery Status Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className={`col-span-2 rounded-2xl border p-6 flex flex-col justify-between transition-colors duration-500 ${isRecoverable ? 'bg-accent/5 border-accent/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {isRecoverable ? <ShieldCheck className="text-accent" /> : <ShieldAlert className="text-red-500" />}
                                        <h4 className={`text-sm font-black uppercase tracking-widest ${isRecoverable ? 'text-accent' : 'text-red-500'}`}>
                                            {isRecoverable ? 'DATA RECOVERABLE' : 'DATA LOSS DETECTED'}
                                        </h4>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-text-primary opacity-60">REDUNDANCY: {totalActiveShards}/{redundancyK + redundancyM}</span>
                                </div>
                                <div className="w-full h-2 bg-root rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${isRecoverable ? 'bg-accent' : 'bg-red-500'}`} style={{ width: `${recoveryProgress}%` }} />
                                </div>
                                <div className="mt-3 text-[10px] text-text-muted flex justify-between">
                                    <span>Tolerated Failures: {redundancyM} concurrent</span>
                                    <span>Recovery Threshold: {redundancyK} shards</span>
                                </div>
                            </div>

                            <div className="bg-elevated border border-border-subtle rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                                <Anchor size={20} className="text-secondary mb-2" />
                                <div className="text-2xl font-black text-text-primary font-mono">{stats.anchoredEvents}</div>
                                <div className="text-[10px] font-bold text-text-muted uppercase">Anchored Events</div>
                            </div>
                        </div>

                        <div className="bg-surface border border-border-subtle rounded-2xl p-6">
                            <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center">
                                <Info size={16} className="mr-2 text-accent" />
                                Protocol Insight
                            </h4>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Xandeum utilizes **k+m Erasure Coding** where data is split into {redundancyK} data shards and {redundancyM} parity shards. Any combination of {redundancyK} shards can reconstruct the original file. This provides high availability with only {((redundancyK + redundancyM) / redundancyK).toFixed(1)}x storage overhead, significantly more efficient than traditional 3x replication.
                                {enableTSS && " Threshold Signature Scheme (TSS) ensures that storage challenges are validated by a quorum of nodes without exposing sensitive keys."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
