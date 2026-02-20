import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Beaker, Calculator, Info, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';

const FertilizerCalculator = () => {
    const { t } = useLanguage();
    const [plotSize, setPlotSize] = useState(1);
    const [selectedCrop, setSelectedCrop] = useState('Paddy (Dhan)');
    const [results, setResults] = useState(null);

    const cropData = {
        'Paddy (Dhan)': { urea: 100, dap: 60, mop: 40 },
        'Wheat': { urea: 120, dap: 50, mop: 30 },
        'Maize': { urea: 150, dap: 75, mop: 50 },
        'Cotton': { urea: 80, dap: 40, mop: 30 },
        'Chilli': { urea: 90, dap: 50, mop: 40 },
        'Onion': { urea: 60, dap: 40, mop: 40 }
    };

    const calculateFertilizer = () => {
        const factor = parseFloat(plotSize);
        const baseline = cropData[selectedCrop] || { urea: 100, dap: 50, mop: 40 };

        setResults({
            urea: (baseline.urea * factor).toFixed(1),
            dap: (baseline.dap * factor).toFixed(1),
            mop: (baseline.mop * factor).toFixed(1)
        });
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-4"
                >
                    <div className="p-3 bg-green-500 rounded-2xl shadow-lg shadow-green-200 text-white">
                        <Beaker size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('fertilizerCalc')}</h1>
                        <p className="text-slate-500 font-medium">{t('fertilizerSubtitle')}</p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-slate-50"
                >
                    <div className="space-y-8">
                        <div>
                            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                                {t('cropName')}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(cropData).map((crop) => (
                                    <button
                                        key={crop}
                                        onClick={() => setSelectedCrop(crop)}
                                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border-2 ${selectedCrop === crop
                                            ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100'
                                            : 'bg-slate-50 border-slate-50 text-slate-500 hover:border-green-200'
                                            }`}
                                    >
                                        {t(crop) || crop}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">
                                    {t('plotSize')} ({t('acre')})
                                </label>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-lg font-black">
                                    {plotSize}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="50"
                                step="0.5"
                                value={plotSize}
                                onChange={(e) => setPlotSize(e.target.value)}
                                className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                <span>0.5 {t('acre')}</span>
                                <span>50 {t('acre')}</span>
                            </div>
                        </div>

                        <button
                            onClick={calculateFertilizer}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                            <Calculator size={20} />
                            {t('calculate')}
                        </button>
                    </div>
                </motion.div>

                {/* Results Section */}
                <div className="space-y-6">
                    {results ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            <div className="bg-green-600 rounded-3xl p-8 text-white shadow-2xl shadow-green-200 relative overflow-hidden group">
                                <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={18} />
                                    {t('totalRequirement')}
                                </h3>

                                <div className="space-y-6">
                                    {[
                                        { label: t('urea'), value: results.urea, icon: '⚪' },
                                        { label: t('dap'), value: results.dap, icon: '🟤' },
                                        { label: t('mop'), value: results.mop, icon: '🔴' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between border-b border-white/20 pb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.icon}</span>
                                                <span className="font-bold text-lg">{item.label}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-3xl font-black">{item.value}</span>
                                                <span className="ml-1 text-sm font-bold opacity-70">kg</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 bg-white/10 rounded-2xl flex items-start gap-3">
                                    <Info className="flex-shrink-0" size={18} />
                                    <p className="text-[11px] font-medium leading-relaxed opacity-90">
                                        {t('fertilizerNote')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full bg-slate-100 rounded-3xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                                <Calculator size={40} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest mb-2">{t('readyToCalculate')}</h3>
                            <p className="text-xs font-bold leading-relaxed">{t('selectCropPrompt')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FertilizerCalculator;
