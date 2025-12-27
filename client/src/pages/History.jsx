import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Download, Search, Filter, ArrowRight, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { getHistory, deletePrediction } from '../services/api';

const History = () => {
    const { t } = useLanguage();
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await getHistory();
            setHistoryItems(data);
        } catch (err) {
            console.error("History Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        // Debugging: confirm the click is registered
        alert(`${t('attemptDelete')} ${id}`);

        try {
            await deletePrediction(id);
            setHistoryItems(prev => prev.filter(item => item.id !== id));
            alert(t('deleteSuccess'));
        } catch (err) {
            console.error("Delete failed:", err);
            // Show the exact error message to help debugging
            const msg = err.response?.data?.error || err.message || "Unknown Error";
            alert(`${t('deleteFail')} ${msg}`);
        }
    };

    const handleViewImage = (e, imageUrl) => {
        if (!imageUrl || imageUrl.includes('image-not-stored')) {
            e.preventDefault();
            alert("Original image was not saved properly due to a previous configuration error.");
            return;
        }
        // Patch the URL if it uses the wrong bucket domain (fix for older but successful uploads)
        if (imageUrl.includes('firebasestorage.app')) {
            e.preventDefault();
            const fixedUrl = imageUrl.replace('firebasestorage.app', 'appspot.com');
            window.open(fixedUrl, '_blank');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        try {
            // Handle Firestore Timestamp objects (seconds / _seconds)
            const seconds = timestamp.seconds || timestamp._seconds;
            if (seconds) {
                return new Date(seconds * 1000).toLocaleDateString();
            }
            // Handle ISO Strings or Date objects
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
                    <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Manage your previous crop scans and reports</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button className="flex-1 md:flex-none btn-outline flex items-center justify-center gap-2" onClick={() => window.print()}>
                        <Download size={18} /> Export PDF
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
                            <Filter size={16} /> Filter:
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
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Crop / Disease</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Fetching Records...</p>
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
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${item.severity === 'None' || item.disease === 'Healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                        {item.disease === 'Healthy' ? '🌿' : '🍂'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        {item.crop && (
                                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-wide mb-0.5">{item.crop}</span>
                                                        )}
                                                        <span className="font-black text-slate-900">{item.disease}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Confidence: {(item.confidence * 100).toFixed(1)}%</span>
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
                                                    {item.severity || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                                    Cloud Synced
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a href={item.imageUrl} onClick={(e) => handleViewImage(e, item.imageUrl)} target="_blank" rel="noreferrer" className="inline-block text-slate-400 hover:text-primary transition-all p-2 rounded-lg bg-white border border-slate-100 hover:border-primary/20" title="View Image">
                                                        <ExternalLink size={18} />
                                                    </a>
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
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records found matching your filters</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center">
                <button className="text-primary font-black uppercase tracking-widest text-xs hover:underline flex items-center justify-center gap-2 mx-auto">
                    Load More History <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};
export default History;
