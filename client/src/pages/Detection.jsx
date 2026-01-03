import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertTriangle, Info, Sparkles, X, ShieldCheck, Camera, ImageIcon } from 'lucide-react';
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
            alert('Please select a valid image file');
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) processFile(files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setLoading(true);
        setResult(null);
        setSaved(false);

        try {
            // 1. Submit the Job
            const initialResponse = await detectDisease(selectedFile);
            const { jobId } = initialResponse;

            if (!jobId) {
                setResult(initialResponse);
                setLoading(false);
                return;
            }

            // 2. Poll for Status (Every 3 seconds)
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await axios.get(`${api.defaults.baseURL}/status/${jobId}`);
                    const job = statusRes.data;

                    if (job.status === 'completed') {
                        clearInterval(pollInterval);
                        setResult(job.result);
                        setLoading(false);
                    } else if (job.status === 'failed') {
                        clearInterval(pollInterval);
                        alert("Analysis Error: " + job.error);
                        setLoading(false);
                    }
                } catch (e) {
                    console.warn("Polling retry...", e.message);
                }
            }, 3000);

        } catch (error) {
            console.error('Detection failed:', error);
            alert(`Analysis failed. The engine might be under heavy load. Please try again.`);
            setLoading(false);
        }
    };

    const handleCommitToCloud = () => {
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
                ...result,
                timestamp: new Date().toISOString()
            };

            history.unshift(newRecord);
            localStorage.setItem(storageKey, JSON.stringify(history.slice(0, 50)));
        } catch (err) {
            console.error("Save error:", err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4">
            <div className="text-center space-y-4">
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase"
                    >
                        <Sparkles size={14} /> Neural-Net Diagnostics
                    </motion.div>

                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter border ${aiStatus === 'online' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${aiStatus === 'online' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        Engine: {aiStatus === 'online' ? 'Ready' : 'Warming Up...'}
                    </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{t('aiCropDoctor')}</h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">{t('detectionSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Upload Panel */}
                <motion.div layout className="card-base p-6 md:p-10 min-h-[400px] flex flex-col justify-center">
                    {!preview ? (
                        <label
                            className={`group border-4 border-dashed rounded-[3rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-slate-100 hover:bg-slate-50'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center space-y-6">
                                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                                    <Camera size={40} />
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-900">{t('readyToScan')}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase mt-2">{t('dropImage')}</p>
                                </div>
                            </div>
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-slate-100 border border-slate-100 aspect-video">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setPreview(null); setSelectedFile(null); setResult(null); }}
                                    className="absolute top-4 right-4 bg-white/90 p-3 rounded-xl shadow-xl hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {!result && !loading && (
                                <button
                                    onClick={handleUpload}
                                    disabled={aiStatus !== 'online'}
                                    className={`w-full py-5 rounded-2xl text-xl font-black flex items-center justify-center gap-3 transition-all ${aiStatus === 'online' ? 'bg-primary text-white hover:scale-[1.02] shadow-xl' : 'bg-slate-100 text-slate-400'
                                        }`}
                                >
                                    <Sparkles size={24} /> {aiStatus === 'online' ? t('analyzeInfection') : 'Engine Warming...'}
                                </button>
                            )}

                            {loading && (
                                <div className="flex flex-col items-center gap-4 py-6">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-primary font-black uppercase text-[10px] tracking-widest">{t('computing')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Result Panel */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${result.disease === 'Healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {result.disease === 'Healthy' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t(result.disease) || result.disease}</h2>
                                        <p className="text-slate-500 font-bold text-sm uppercase">{t(result.crop) || result.crop}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Confidence</p>
                                        <p className="text-xl font-black text-primary mt-1">{(result.confidence * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Severity</p>
                                        <p className="text-xl font-black text-slate-900 mt-1">{t(result.severity) || result.severity || 'N/A'}</p>
                                    </div>
                                </div>

                                {result.disease !== 'Healthy' && result.disease !== 'Not a Crop' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black">{t('recommendedRecovery')}</h3>
                                        <div className="space-y-2">
                                            {result.recommendations?.pesticides?.map((p, i) => (
                                                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                                                    <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-primary font-bold shadow-sm">{i + 1}</div>
                                                    <span className="font-bold text-slate-600">{t(p)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!saved ? (
                                    <button
                                        onClick={handleCommitToCloud}
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-3"
                                    >
                                        <ShieldCheck size={20} /> {t('saveToCloud')}
                                    </button>
                                ) : (
                                    <div className="w-full py-5 bg-green-600 text-white rounded-2xl font-black flex items-center justify-center gap-3">
                                        <CheckCircle size={20} /> Report Saved Successfully
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                                <h3 className="text-xl font-black mb-6">{t('howItWorks')}</h3>
                                <div className="space-y-8">
                                    {[
                                        { icon: "🎯", title: t('singleSubject'), desc: t('singleSubjectDesc') },
                                        { icon: "☀️", title: t('naturalLight'), desc: t('naturalLightDesc') },
                                        { icon: "🌿", title: t('highContext'), desc: t('highContextDesc') }
                                    ].map((step, i) => (
                                        <div key={i} className="flex gap-4">
                                            <span className="text-3xl">{step.icon}</span>
                                            <div>
                                                <p className="font-black text-slate-900">{step.title}</p>
                                                <p className="text-sm text-slate-500 font-medium">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Detection;
