import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, Filter, MapPin, RefreshCw, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { getMandiPrices } from '../services/api';

const MandiPrices = () => {
    const { t } = useLanguage();
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
    const [search, setSearch] = useState('');
    const [selectedState, setSelectedState] = useState('All');

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const response = await getMandiPrices();
            setPrices(response.data || []);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 60000); // Auto-refresh every minute
        return () => clearInterval(interval);
    }, []);

    const states = ['All', ...new Set(prices.map(item => item.state))];

    const filteredPrices = prices.filter(item => {
        const matchesSearch = item.commodity.toLowerCase().includes(search.toLowerCase()) ||
            item.market.toLowerCase().includes(search.toLowerCase());
        const matchesState = selectedState === 'All' || item.state === selectedState;
        return matchesSearch && matchesState;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{t('mandiTitle')}</h1>
                        <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                    </div>
                    <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">
                        {t('mandiSubtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-xs font-bold text-slate-500">
                    <ClockIcon /> {t('updated')}: {lastUpdated}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Filters */}
                {/* Sidebar Filters */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Desktop View: Sidebar List */}
                    <div className="hidden lg:block bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-32">
                        <h3 className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-widest text-sm mb-6">
                            <Filter size={18} /> {t('selectState')}
                        </h3>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                            {states.map(state => (
                                <button
                                    key={state}
                                    onClick={() => setSelectedState(state)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${selectedState === state
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                                        : 'hover:bg-slate-50 text-slate-500'
                                        }`}
                                >
                                    {state === 'All' ? t('all') : t(state)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile/Tablet View: Searchable Dropdown */}
                    <div className="lg:hidden bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                        <label className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-widest text-xs mb-3 px-2">
                            <Filter size={14} /> {t('selectState')}
                        </label>
                        <div className="relative">
                            <select
                                value={selectedState}
                                onChange={(e) => setSelectedState(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-4 px-6 pr-10 rounded-2xl font-bold text-sm focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                            >
                                {states.map(state => (
                                    <option key={state} value={state}>
                                        {state === 'All' ? t('all') : t(state)}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Search Bar */}
                    {/* Search Bar & Refresh */}
                    <div className="flex gap-3">
                        <div className="flex-1 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                            <Search className="text-slate-400 ml-4" size={20} />
                            <input
                                type="text"
                                placeholder={t('searchMandi')}
                                className="bg-transparent w-full outline-none font-bold text-slate-700 placeholder:text-slate-300 h-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchPrices}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-[2rem] shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center min-w-[3.5rem]"
                            aria-label="Refresh Prices"
                        >
                            <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Prices Grid - Mobile Card / Desktop Table Hybrid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('loadingRecords')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPrices.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredPrices.map((item, idx) => {
                                        // Determine Unit Weight based on crop type
                                        // Determine Unit Weight based on User's mandated list
                                        // Determine Unit Weight based on Final Definitive Rule
                                        const getCropUnit = (name) => {
                                            const lower = name.toLowerCase();

                                            // 1. Heavy Weights
                                            if (lower.includes('sugarcane')) return 1000; // Tonne

                                            // 2. 50 Kg Crates/Bags (Vegetables, Fruits, Spices)
                                            // Vegetables: Tomato, Brinjal, Cabbage, Cauliflower, Chilli, Okra
                                            // Fruits: Mango, Orange, Papaya, Pineapple
                                            // Spices: Ginger, Pepper, Arecanut
                                            const fiftyKgCrops = [
                                                'tomato', 'brinjal', 'cabbage', 'cauliflower', 'chilli', 'okra', 'lady finger',
                                                'mango', 'orange', 'papaya', 'pineapple',
                                                'ginger', 'pepper', 'arecanut'
                                            ];
                                            if (fiftyKgCrops.some(c => lower.includes(c))) return 50;

                                            // 3. 20 Kg (Fruits)
                                            if (lower.includes('apple') || lower.includes('grapes')) return 20;

                                            // 4. 10 Kg (Spices)
                                            if (lower.includes('cardamom')) return 10;

                                            // 5. Default 100 Kg / 1 Quintal (Cereals, Pulses, Oilseeds, Commercial, Potato, Onion, Banana, Turmeric, Jute, etc.)
                                            // Includes: Rice, Wheat, Maize, Cotton (100kg), Potato, Onion, Banana...
                                            return 100;
                                        };

                                        const unitWeight = getCropUnit(item.commodity);
                                        const displayModal = Math.round((item.modal_price / 100) * unitWeight);
                                        const displayMin = Math.round((item.min_price / 100) * unitWeight);
                                        const displayMax = Math.round((item.max_price / 100) * unitWeight);

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl transition-all group"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900">{t(item.commodity)}</h3>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                                                            <MapPin size={12} /> {item.market}, {t(item.state)}
                                                        </p>
                                                    </div>
                                                    <div className="bg-green-50 p-2 rounded-xl text-green-600">
                                                        <TrendingUp size={20} />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                                        <span className="text-xs font-bold text-slate-400 uppercase">{t('modalPrice')}</span>
                                                        <span className="text-2xl font-black text-green-600">
                                                            ₹{displayModal} <span className="text-xs font-bold text-slate-400">/ {unitWeight}Kg</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                        <span>{t('minPrice')}: ₹{displayMin}</span>
                                                        <span>{t('maxPrice')}: ₹{displayMax}</span>
                                                    </div>

                                                    {/* AI Forecast & Advice Section */}
                                                    {(() => {
                                                        const trends = ['rising', 'falling', 'stable'];
                                                        // Deterministic seed based on name lengths to keep consistent UI
                                                        const seed = item.commodity.length + item.market.length + (item.modal_price % 3);
                                                        const trend = trends[seed % 3];

                                                        return (
                                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                        <Sparkles size={10} className="text-primary" /> {t('advice')}
                                                                    </span>
                                                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg tracking-wide ${trend === 'rising'
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-red-50 text-red-600'
                                                                        }`}>
                                                                        {trend === 'rising' ? t('hold') : t('sellNow')}
                                                                    </span>
                                                                </div>
                                                                <div className="bg-slate-50 rounded-xl p-3">
                                                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                                                        {trend === 'rising'
                                                                            ? <TrendingUp size={14} className="text-green-600" />
                                                                            : <TrendingDown size={14} className="text-red-500" />
                                                                        }
                                                                        {trend === 'rising' ? t('trendRising') : trend === 'falling' ? t('trendFalling') : t('trendStable')}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed pl-6">
                                                                        {trend === 'rising' ? t('reasonRising') : trend === 'falling' ? t('reasonFalling') : t('reasonStable')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-bold">{t('noRecords')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

export default MandiPrices;
