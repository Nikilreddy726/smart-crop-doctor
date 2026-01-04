import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Wallet, BarChart3, PieChart, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';

const FinancialTracker = () => {
    const { t } = useLanguage();
    const [investment, setInvestment] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [yieldAmount, setYieldAmount] = useState(0);
    const [marketPrice, setMarketPrice] = useState(0);
    const [analysis, setAnalysis] = useState(null);

    const calculateProfit = () => {
        const totalCost = parseFloat(investment) + parseFloat(expenses);
        const totalRevenue = parseFloat(yieldAmount) * parseFloat(marketPrice);
        const netProfit = totalRevenue - totalCost;
        const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

        setAnalysis({
            netProfit,
            revenue: totalRevenue,
            cost: totalCost,
            roi: roi.toFixed(1),
            isProfit: netProfit >= 0
        });
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-4"
                >
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('financialTracker')}</h1>
                        <p className="text-slate-500 font-medium">{t('financialSubtitle') || 'Track every rupee invested and earned from your harvest.'}</p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-100 border border-slate-50">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                            <Wallet size={18} className="text-indigo-600" />
                            Expense Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t('initialInvestment')}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Seeds, Tilling, Plowing"
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-10 pr-4 font-bold text-slate-900 focus:border-indigo-500 transition-all outline-none"
                                        onChange={(e) => setInvestment(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t('otherExpenses')}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Labor, Water, Power"
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-10 pr-4 font-bold text-slate-900 focus:border-indigo-500 transition-all outline-none"
                                        onChange={(e) => setExpenses(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Total Yield (Quintals)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="e.g. 50"
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-4 font-bold text-slate-900 focus:border-indigo-500 transition-all outline-none"
                                        onChange={(e) => setYieldAmount(e.target.value)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black uppercase">Qtls</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t('salePrice')}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        placeholder="Price per Quintal"
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-10 pr-4 font-bold text-slate-900 focus:border-indigo-500 transition-all outline-none"
                                        onChange={(e) => setMarketPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={calculateProfit}
                            className="w-full mt-10 bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100"
                        >
                            <BarChart3 size={20} />
                            Generate Report
                        </button>
                    </div>
                </motion.div>

                {/* Analysis/Results Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {analysis ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            {/* Main Profit/Loss Card */}
                            <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl ${analysis.isProfit ? 'bg-emerald-600 shadow-emerald-200' : 'bg-red-600 shadow-red-200'}`}>
                                <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-3xl" />

                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">
                                    {t('estimatedNetProfit')}
                                </h3>

                                <div className="flex items-end gap-2 mb-8">
                                    <span className="text-5xl font-black">₹{analysis.netProfit.toLocaleString()}</span>
                                    <div className={`p-1 rounded-full mb-2 ${analysis.isProfit ? 'bg-emerald-400' : 'bg-red-400'}`}>
                                        {analysis.isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 p-4 rounded-2xl">
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-70 block mb-1">ROI</span>
                                        <span className="text-xl font-black">{analysis.roi}%</span>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl">
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-70 block mb-1">Status</span>
                                        <span className="text-xl font-black uppercase tracking-tighter">{analysis.isProfit ? t('profit') : t('loss')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown Card */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Analysis Breakdown</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                                        <span className="text-xs font-bold text-slate-600">Total Revenue</span>
                                        <span className="font-black text-indigo-600">₹{analysis.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                                        <span className="text-xs font-bold text-slate-600">Total Investment</span>
                                        <span className="font-black text-red-500">₹{analysis.cost.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-[400px] bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                            <PieChart size={48} className="mb-4 opacity-50" />
                            <h4 className="font-black uppercase tracking-widest text-sm mb-2">Financial Hub</h4>
                            <p className="text-[11px] font-bold leading-relaxed px-4">Enter your seasonal investment data to see an AI-driven profitability analysis.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinancialTracker;
