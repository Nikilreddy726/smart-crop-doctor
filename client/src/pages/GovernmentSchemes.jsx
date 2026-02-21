import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronRight, Landmark, BadgeCheck, X, FileCheck, RefreshCw } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { getSchemes } from '../services/api';

const GovernmentSchemes = () => {
    const { t, translations, en } = useLanguage();
    const [selectedScheme, setSelectedScheme] = useState(null);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchemes = async () => {
            try {
                const data = await getSchemes();
                if (data && data.length > 0) {
                    setSchemes(data);
                } else {
                    setSchemes(translations?.schemesData || en?.schemesData || []);
                }
            } catch (e) {
                setSchemes(translations?.schemesData || en?.schemesData || []);
            } finally {
                setLoading(false);
            }
        };
        fetchSchemes();
    }, [translations, en]);

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <header className="space-y-4">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{t('schemesTitle')}</h1>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">{t('schemesSubtitle')}</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <RefreshCw className="w-10 h-10 text-green-500 animate-spin" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('loadingRecords') || 'Loading Schemes...'}</p>
                    </div>
                ) : (
                    schemes.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="group card-base p-10 flex flex-col justify-between hover:border-primary transition-all hover:scale-[1.02] hover:shadow-2xl"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="bg-primary/5 p-4 rounded-3xl text-primary group-hover:scale-110 transition-transform">
                                        <Landmark size={32} />
                                    </div>
                                    <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {item.provider}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                                    <div className="flex items-center gap-2 text-green-600 font-black">
                                        <BadgeCheck size={18} /> {item.benefit}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('eligibilityLabel')}</p>
                                    <p className="text-slate-600 font-bold">{item.eligibility}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-8">
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 btn-primary py-4 flex items-center justify-center gap-2"
                                >
                                    {t('applyNow')} <ChevronRight size={18} />
                                </a>
                                <button
                                    onClick={() => setSelectedScheme(item)}
                                    className="btn-outline flex items-center justify-center gap-2"
                                >
                                    <FileText size={18} /> {t('details')}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Details Modal (Popup) */}
            <AnimatePresence>
                {selectedScheme && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setSelectedScheme(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] p-8 md:p-12 w-full max-w-2xl relative z-10 shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-hide"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-2 pr-8">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {selectedScheme.provider}
                                        </span>
                                        <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {selectedScheme.benefit}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                                        {selectedScheme.title}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedScheme(null)}
                                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="flex items-center gap-2 text-sm font-black text-primary uppercase tracking-widest mb-3">
                                        <FileText size={18} /> {t('aboutScheme')}
                                    </h4>
                                    <p className="text-slate-600 font-medium leading-relaxed text-lg">
                                        {selectedScheme.details}
                                    </p>
                                </div>

                                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                                    <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
                                        <FileCheck size={18} /> {t('reqDocs')}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedScheme.docs.map((doc, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{doc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <a
                                        href={selectedScheme.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 btn-primary py-5 flex items-center justify-center gap-2 text-lg shadow-xl shadow-green-200"
                                    >
                                        {t('applyWebsite')} <ChevronRight size={20} />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default GovernmentSchemes;
