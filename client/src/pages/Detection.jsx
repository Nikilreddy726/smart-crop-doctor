import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertTriangle, Info, Sparkles, X, ShieldCheck, Camera, ImageIcon, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api, { detectDisease, getHealth } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';

const Detection = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [saved, setSaved] = useState(false);
    const [aiStatus, setAiStatus] = useState('warming');

    // --- AUTO-WARMING LOGIC ---
    useEffect(() => {
        const warmUp = async () => {
            try {
                const health = await getHealth();
                setAiStatus(health.ai);
                if (health.ai !== 'online') {
                    setTimeout(warmUp, 10000);
                }
            } catch (e) {
                setAiStatus('offline');
                setTimeout(warmUp, 10000);
            }
        };
        warmUp();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setSaved(false);
        } else {
            alert(t('locationNotFound') || 'Please select a valid image file');
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) processFile(files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setLoading(true);
        setResult(null);
        setSaved(false);

        let location = null;
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        } catch (e) {
            console.log("Location tagging skipped:", e.message);
        }

        try {
            const response = await detectDisease(selectedFile, location);
            // Backend returns result directly (no job queue on this server)
            if (response && response.disease) {
                setResult(response);
            } else if (response && response.jobId) {
                // Legacy polling path (in case backend adds queue later)
                const pollInterval = setInterval(async () => {
                    try {
                        const statusRes = await axios.get(`${api.defaults.baseURL}/status/${response.jobId}`);
                        const job = statusRes.data;
                        if (job.status === 'completed') {
                            clearInterval(pollInterval);
                            setResult(job.result);
                            setLoading(false);
                        } else if (job.status === 'failed') {
                            clearInterval(pollInterval);
                            alert(t('waitingForEngine'));
                            setLoading(false);
                        }
                    } catch (e) { console.log("Status check retry..."); }
                }, 3000);
                return; // Don't run setLoading(false) below
            } else {
                alert(t('weatherError') + ': Invalid response from AI service');
            }
        } catch (error) {
            console.error('Detection failed:', error);
            const errMsg = error.response?.data?.error || error.message;
            alert(`Detection failed: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCommitToCloud = () => {
        if (!result || result.disease === 'Not a Crop') return;

        try {
            setSaved(true);
            const storageKey = user ? `local_crop_scans_${user.uid}` : 'local_crop_scans';
            const raw = localStorage.getItem(storageKey);
            let history = [];
            try {
                if (raw) history = JSON.parse(raw);
            } catch (e) { history = []; }

            const newRecord = {
                id: result.id || 'local-' + Date.now(),
                disease: result.disease,
                crop: result.crop,
                severity: result.severity,
                confidence: result.confidence,
                recommendations: result.recommendations,
                imageUrl: result.imageUrl || 'image-not-stored',
                timestamp: new Date().toISOString()
            };

            history.unshift(newRecord);
            localStorage.setItem(storageKey, JSON.stringify(history.slice(0, 50)));
        } catch (err) {
            console.error("Save error:", err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
            {/* Header Content */}
            <div className="text-center space-y-3 sm:space-y-4 px-4">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full text-[9px] sm:text-[10px] font-black tracking-widest uppercase"
                    >
                        <Sparkles size={12} /> {t('neuralNetDiagnostics')}
                    </motion.div>

                    {/* Status Indicator */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter border ${aiStatus === 'online' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${aiStatus === 'online' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        {t('engineStatus')}: {aiStatus === 'online' ? t('engineReady') : t('engineWarming')}
                    </div>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none">{t('aiCropDoctor')}</h1>
                <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto font-medium opacity-80">{t('detectionSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start h-full px-4">
                {/* Upload Panel (Compact & Sticky) */}
                <motion.div layout className="md:col-span-5 lg:col-span-4 sticky top-24">
                    <div className="card-base p-6 flex flex-col justify-center min-h-[350px]">
                        {!preview ? (
                            <label
                                className={`group relative w-full h-full min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[2rem] md:rounded-[3rem] cursor-pointer transition-all duration-500 ${isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-slate-100 hover:border-primary/20 hover:bg-slate-50'
                                    }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 pointer-events-none p-4">
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-[2rem] flex items-center justify-center transition-all duration-700 ${isDragging ? 'bg-primary scale-110 rotate-12' : 'bg-slate-100 group-hover:scale-110 group-hover:rotate-12'
                                        }`}>
                                        <Camera className={`w-8 h-8 sm:w-10 sm:h-10 ${isDragging ? 'text-white' : 'text-primary'}`} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                                            {isDragging ? t('dropImageHere') : t('readyToScan')}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-black mt-1 sm:mt-2 uppercase tracking-[0.2em]">{t('dropImage')}</p>
                                    </div>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        ) : (
                            <div className="space-y-6 h-full flex flex-col">
                                <div className="relative group rounded-3xl overflow-hidden shadow-xl aspect-square bg-slate-900 border border-slate-800">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => { setPreview(null); setSelectedFile(null); setResult(null); }}
                                        className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-2xl"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {!result && !loading && (
                                        <div className="space-y-4 w-full">
                                            <motion.button
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={handleUpload}
                                                className="w-full py-6 rounded-2xl text-xl font-black shadow-2xl flex items-center justify-center gap-3 transition-all bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95"
                                            >
                                                <Sparkles size={24} />
                                                {t('analyzeInfection')}
                                            </motion.button>

                                            {aiStatus !== 'online' && (
                                                <p className="text-center text-[10px] text-slate-400 font-bold px-4 leading-tight animate-pulse">
                                                    ⏳ {t('waitingForEngine')}
                                                    <br />
                                                    <span className="text-[9px] font-medium opacity-50">
                                                        {t('renderBootNote')}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {loading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center gap-4 py-4"
                                        >
                                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <div className="text-center space-y-2">
                                                <p className="text-primary font-black animate-pulse tracking-widest text-xs uppercase">{t('computing')}</p>
                                                <p className="text-[10px] text-slate-400 font-bold max-w-[200px] leading-tight">
                                                    {t('analyzingPixels')}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Result Panel (Compact Detail View) */}
                <div className="md:col-span-7 lg:col-span-8 h-full">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6 overflow-hidden relative"
                            >
                                {/* Professional Diagnosis Banner */}
                                <div className="absolute top-0 right-0 px-4 py-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">
                                    {t('bioScan')}
                                </div>

                                {/* Disease Header */}
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-2xl ${result.severity === 'None' || result.disease === 'Healthy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {result.severity === 'None' || result.disease === 'Healthy' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                                </div>
                                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{t(result.disease) || result.disease}</h2>
                                            </div>
                                            {result.scientific_name && (
                                                <p className="text-indigo-600 font-bold italic tracking-wide text-[10px] pl-1">
                                                    {result.scientific_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Advanced Metrics Cards */}
                                    {result.disease !== 'Not a Crop' && (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">🧬 {t('typeLabel')}</p>
                                                <p className="text-sm font-black text-slate-800 leading-tight">{t(result.pathogen) || result.pathogen || 'Biological'}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-green-200 transition-all">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">🌱 {t('cropLabel')}</p>
                                                <p className="text-sm font-black text-slate-800 leading-tight">{t(result.crop) || result.crop}</p>
                                            </div>
                                            <div className={`p-3 rounded-2xl border ${result.severity === 'High' ? 'bg-red-50/50 border-red-100' : 'bg-green-50/50 border-green-100'}`}>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">⚠️ {t('riskLabel')}</p>
                                                <p className={`text-sm font-black leading-tight ${result.severity === 'High' ? 'text-red-700' : 'text-green-700'}`}>
                                                    {t(result.severity) || result.severity}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Deep recommendations categorization */}
                                {result.disease !== 'Not a Crop' && result.disease !== 'Healthy' && (
                                    <div className="space-y-6 pt-2">
                                        {/* Biological Solutions */}
                                        <div className="space-y-3">
                                            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
                                                <Leaf size={14} /> {t('biologicalControl')}
                                            </h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                {(result.recommendations?.organic_solutions || ['Regular monitoring']).map((p, i) => (
                                                    <div key={i} className="px-3.5 py-2.5 rounded-xl bg-emerald-50/30 border border-emerald-100/50 flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                        <p className="text-emerald-900 font-bold text-xs">{t(p) || p}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chemical Treatments */}
                                        <div className="space-y-3">
                                            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                                                <div className="p-1 bg-indigo-100 rounded text-indigo-600"><CheckCircle size={10} /></div> {t('chemicalTreatment')}
                                            </h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                {(result.recommendations?.pesticides || []).map((p, i) => (
                                                    <div key={i} className="px-3.5 py-2.5 rounded-xl bg-indigo-50/30 border border-indigo-100/50 flex items-center justify-between">
                                                        <p className="text-indigo-900 font-bold text-xs">{t(p) || p}</p>
                                                        <Link to="/shops" className="text-[9px] font-black uppercase text-indigo-600 hover:underline">{t('retailer')} →</Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* REJECTION UI remain same for structural consistency, but updated text for bio-diagnostic feel */}
                                {result.disease === 'Not a Crop' && (
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="p-8 bg-red-50/30 rounded-3xl border-2 border-dashed border-red-100 text-center space-y-4"
                                    >
                                        <div className="p-4 rounded-2xl bg-red-100 text-red-600 shadow-lg inline-block font-black">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <h2 className="text-xl font-black text-red-900 tracking-tight">{t('aiValidationFailed')}</h2>
                                        <p className="text-red-700/70 font-bold max-w-[200px] mx-auto text-[10px] leading-relaxed">
                                            {t('notPlantTissue')}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Interaction Ecosystem */}
                                {result.disease !== 'Not a Crop' && (
                                    <div className="space-y-4 pt-8">
                                        {!saved ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <button
                                                    onClick={handleCommitToCloud}
                                                    className="py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-slate-900 text-white hover:bg-primary shadow-lg shadow-slate-200"
                                                >
                                                    {t('saveToHistory')}
                                                </button>
                                                <Link
                                                    to="/community"
                                                    className="py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 border-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center gap-2"
                                                >
                                                    {t('askExperts')}
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-green-600 text-white shadow-lg shadow-green-100">
                                                    <CheckCircle size={20} /> {t('reportSaved')}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); setSaved(false); }}
                                                        className="py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-100 text-slate-500 hover:bg-slate-50"
                                                    >
                                                        {t('detect')}
                                                    </button>
                                                    <Link
                                                        to="/dashboard"
                                                        className="py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-primary text-white text-center flex items-center justify-center"
                                                    >
                                                        Dashboard
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {result.disease === 'Not a Crop' && (
                                    <button
                                        onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); setSaved(false); }}
                                        className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-2"
                                    >
                                        <Camera size={18} /> {t('retryCapture')}
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-8"
                            >
                                <div className="card-base p-8 h-full flex flex-col justify-center min-h-[350px] md:min-h-[400px]">
                                    <div className="space-y-4 mb-8">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                <Sparkles size={16} />
                                            </div>
                                            {t('aiDiagnosticWorkflow')}
                                        </h3>
                                        <p className="text-slate-500 text-xs font-medium max-w-xs">{t('healthReportSteps')}</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        {[
                                            { title: t('step1Title'), desc: t('step1Desc'), icon: <Camera size={18} />, color: "bg-blue-50 text-blue-600" },
                                            { title: t('step2Title'), desc: t('step2Desc'), icon: <Sparkles size={18} />, color: "bg-purple-50 text-purple-600" },
                                            { title: t('step3Title'), icon: <CheckCircle size={18} />, desc: t('step3Desc'), color: "bg-green-50 text-green-600" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-4 group">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${item.color}`}>
                                                    {item.icon}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-900 tracking-tight">{item.title}</p>
                                                    <p className="text-slate-500 text-[10px] font-medium leading-tight">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Detection;
