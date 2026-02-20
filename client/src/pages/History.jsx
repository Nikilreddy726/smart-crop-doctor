import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Download, Search, Filter, ArrowRight, ExternalLink, Loader2, Trash2, X } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';
import { getHistory, deletePrediction } from '../services/api';

const ImageWithFallback = ({ src, alt, crop, disease, severity, onClick }) => {
    const [error, setError] = useState(false);

    if (error || !src || src.includes('image-not-stored')) {
        return (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${severity === 'None' || disease === 'Healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {disease === 'Healthy' ? '🌿' : '🍂'}
            </div>
        );
    }

    return (
        <div onClick={onClick} className="cursor-pointer group/img relative">
            <img
                src={src}
                alt={alt}
                onError={() => setError(true)}
                className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-200 group-hover/img:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
        </div>
    );
};

const History = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, [user]);

    const getSafeTime = (ts) => {
        if (!ts) return 0;
        if (ts.seconds) return ts.seconds * 1000;
        if (ts._seconds) return ts._seconds * 1000;
        const d = new Date(ts);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    };

    const fetchHistory = async () => {
        // 1. Instant Load Local
        let localData = [];
        try {
            const storageKey = user ? `local_crop_scans_${user.uid}` : 'local_crop_scans';
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                localData = Array.isArray(parsed) ? parsed : [];
            }
        } catch (e) { console.error("Local Load Error", e); }

        setHistoryItems(localData);
        setLoading(false); // UI is now visible with local records

        // 2. Background Cloud Sync
        try {
            let cloudData = [];
            try {
                const res = await getHistory();
                cloudData = Array.isArray(res) ? res : [];
            } catch (e) {
                console.log("Cloud sync delayed... switching to background wait.");
            }

            if (cloudData.length > 0) {
                const combined = [...localData, ...cloudData].sort((a, b) => {
                    return getSafeTime(b.timestamp) - getSafeTime(a.timestamp);
                });
                setHistoryItems(combined);
            }
        } catch (err) {
            console.error("Cloud background sync failed", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            // Check if local
            if (id.toString().startsWith('local-')) {
                const storageKey = user ? `local_crop_scans_${user.uid}` : 'local_crop_scans';
                const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const filtered = localData.filter(item => item.id !== id);
                localStorage.setItem(storageKey, JSON.stringify(filtered));
                setHistoryItems(prev => prev.filter(item => item.id !== id));
                return;
            }

            await deletePrediction(id);
            setHistoryItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
            const msg = err.response?.data?.error || err.message || "Unknown Error";
            alert(`${t('deleteFail')} ${msg}`);
        }
    };

    const handleViewImage = (e, imageUrl) => {
        e.preventDefault();
        if (!imageUrl || imageUrl.includes('image-not-stored')) {
            alert("Original image was not saved properly due to a previous configuration error.");
            return;
        }
        setSelectedImage(imageUrl);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        try {
            const seconds = timestamp.seconds || timestamp._seconds;
            if (seconds) {
                return new Date(seconds * 1000).toLocaleDateString();
            }
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString();
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '--:--';
        try {
            const seconds = timestamp.seconds || timestamp._seconds;
            if (seconds) {
                return new Date(seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '--:--';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '--:--';
        }
    };

    const filteredItems = historyItems.filter(item => {
        const matchesSearch = item.disease?.toLowerCase().includes(search.toLowerCase()) ||
            item.crop?.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'All') return true;
        if (filter === 'Healthy') return item.disease === 'Healthy';
        if (filter === 'High Severity') return item.severity === 'High';
        if (filter === 'Issues Detected') return item.disease !== 'Healthy';

        return true;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{t('detectionHistory')}</h1>
                    <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">{t('historySubtitle')}</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none btn-outline flex items-center justify-center gap-2" onClick={() => window.print()}>
                        <Download size={18} /> {t('exportPDF')}
                    </button>
                </div>
            </header>

            <div className="card-base overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder={t('filterPlaceholder')}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-10 focus:ring-2 focus:ring-primary outline-none font-bold text-slate-900 text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                    <div className="flex gap-4 items-center flex-wrap justify-center">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Filter size={16} /> {t('filterLabel')}:
                        </span>
                        <div className="flex gap-2">
                            {['All', 'Healthy', 'Issues Detected', 'High Severity'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filter === f ? 'bg-primary text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                >
                                    {f === 'All' ? t('all') :
                                        f === 'Healthy' ? t('healthy') :
                                            f === 'Issues Detected' ? t('issues') : t('highSeverity')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('cropDisease')}</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dateTime')}</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('riskLabel')}</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('statusLabel')}</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('actionLabel')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('fetchingRecords')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredItems.length > 0 ? (
                                <AnimatePresence>
                                    {filteredItems.map((item, idx) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <ImageWithFallback
                                                        src={item.imageUrl}
                                                        alt={t(item.crop) || item.crop || 'Crop Image'}
                                                        crop={item.crop}
                                                        disease={item.disease}
                                                        severity={item.severity}
                                                        onClick={(e) => handleViewImage(e, item.imageUrl)}
                                                    />
                                                    <div className="flex flex-col">
                                                        {item.crop && (
                                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-wide mb-0.5">{t(item.crop) || item.crop}</span>
                                                        )}
                                                        <span className="font-black text-slate-900">{t(item.disease) || item.disease}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{t('confidence')}: {(item.confidence * 100).toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-500">
                                                {formatDate(item.timestamp)}
                                                <span className="opacity-50 mx-2">|</span>
                                                {formatTime(item.timestamp)}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.severity === 'High' ? 'bg-red-50 text-red-700' :
                                                    item.severity === 'None' || item.disease === 'Healthy' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                                                    }`}>
                                                    {t(item.severity) || item.severity || t('unknown')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                                    {t('cloudSynced')}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {(item.imageUrl && !item.imageUrl.includes('image-not-stored')) ? (
                                                        <button
                                                            onClick={(e) => handleViewImage(e, item.imageUrl)}
                                                            className="inline-block text-slate-400 hover:text-primary transition-all p-2 rounded-lg bg-white border border-slate-100 hover:border-primary/20"
                                                            title={t('viewImage')}
                                                        >
                                                            <ExternalLink size={18} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="text-slate-200 cursor-not-allowed p-2 rounded-lg bg-slate-50 border border-slate-100"
                                                            title="Image not available (File Missing)"
                                                        >
                                                            <ExternalLink size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-slate-400 hover:text-red-500 transition-all p-2 px-3 rounded-lg bg-white border border-slate-100 hover:border-red-100 hover:bg-red-50 flex items-center gap-2"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 size={18} /> <span className="text-xs font-bold uppercase">{t('delete')}</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('noRecordsFound')}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center">
                <button className="text-primary font-black uppercase tracking-widest text-xs hover:underline flex items-center justify-center gap-2 mx-auto">
                    {t('loadMore')} <ArrowRight size={14} />
                </button>
            </div>

            {/* Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <img
                                src={selectedImage}
                                alt="Original Crop"
                                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default History;
