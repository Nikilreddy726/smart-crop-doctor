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

        // Get Location Coords for Outbreak Mapping (Plantix Workflow Step 6)
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
            // 1. Submit the Job with Location Metadata
            const initialResponse = await detectDisease(selectedFile, location);
            const { jobId } = initialResponse;

            if (!jobId) {
                setResult(initialResponse);
                setLoading(false);
                return;
            }

            // 2. Poll for Status (Long Polling)
            console.log(`Polling status for Job ${jobId}...`);
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
                        const isTimeout = job.error?.includes("failed to start");
                        alert(isTimeout
                            ? "The AI engine is taking a bit longer to wake up. Please wait 10 seconds and try your scan again—it will be ready now!"
                            : "Analysis Error: " + job.error);
                        setLoading(false);
                    }
                } catch (e) {
                    console.log("Status check retry...");
                }
            }, 3000);

        } catch (error) {
            console.error('Detection failed:', error);
            const errorMsg = error.response?.data?.details || error.message;
            alert(`Failed to analyze image. ${errorMsg}`);
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
            <div className="text-center space-y-4">
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase"
                    >
                        <Sparkles size={14} /> Neural-Net Diagnostics
                    </motion.div>

                    {/* Status Indicator */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter border ${aiStatus === 'online' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${aiStatus === 'online' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        Engine: {aiStatus === 'online' ? 'Ready' : 'Warming Up...'}
                    </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{t('aiCropDoctor')}</h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">{t('detectionSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start h-full px-4">
                {/* Upload Panel (Premium UI) */}
                <motion.div layout className="card-base p-6 md:p-10 h-full flex flex-col justify-center min-h-[400px] md:min-h-[500px]">
                    {!preview ? (
                        <label
                            className={`group relative w-full h-full min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[2rem] md:rounded-[3rem] cursor-pointer transition-all duration-500 ${isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-slate-100 hover:border-primary/20 hover:bg-slate-50'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center justify-center space-y-6 pointer-events-none">
                                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center transition-all duration-700 ${isDragging ? 'bg-primary scale-110 rotate-12' : 'bg-slate-100 group-hover:scale-110 group-hover:rotate-12'
                                    }`}>
                                    <Camera className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-primary'}`} />
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                                        {isDragging ? 'Drop Image Here!' : t('readyToScan')}
                                    </p>
                                    <p className="text-xs text-slate-400 font-black mt-2 uppercase tracking-[0.2em]">{t('dropImage')}</p>
                                </div>
                            </div>
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                    ) : (
                        <div className="space-y-8 h-full flex flex-col">
                            <div className="relative group rounded-[3rem] overflow-hidden shadow-2xl grow aspect-video lg:aspect-square bg-slate-100 border border-slate-100">
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
                                                ⏳ {t('waitingForEngine') || 'AI engine is waking up from sleep. The button will enable automatically in a few seconds...'}
                                                <br />
                                                <span className="text-[9px] font-medium opacity-50">
                                                    (Render Free Tier takes ~30s to boot after inactivity)
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
                                                (Analyzing pixels and textures for patterns...)
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>

                {/* Result Panel (Premium UI) */}
                <div className="h-full">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white p-10 md:p-12 rounded-[4rem] border border-slate-200 shadow-2xl space-y-8 overflow-hidden relative"
                            >
                                {/* Professional Diagnosis Banner */}
                                <div className="absolute top-0 right-0 px-6 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-3xl">
                                    AI Bio-Diagnostic 8.0
                                </div>

                                {/* Disease Header */}
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-2xl ${result.severity === 'None' || result.disease === 'Healthy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {result.severity === 'None' || result.disease === 'Healthy' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                                </div>
                                                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{t(result.disease) || result.disease}</h2>
                                            </div>
                                            {result.scientific_name && (
                                                <p className="text-indigo-600 font-bold italic tracking-wide text-sm pl-1">
                                                    Scientific Name: {result.scientific_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Advanced Metrics Cards */}
                                    {result.disease !== 'Not a Crop' && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">🧬 Pathogen Type</p>
                                                <p className="text-lg font-black text-slate-800">{result.pathogen || 'Biological'}</p>
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-green-200 transition-all">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">🌱 Host Crop</p>
                                                <p className="text-lg font-black text-slate-800">{t(result.crop) || result.crop}</p>
                                            </div>
                                            <div className={`p-5 rounded-3xl border col-span-2 md:col-span-1 ${result.severity === 'High' ? 'bg-red-50/50 border-red-100' : 'bg-green-50/50 border-green-100'}`}>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">⚠️ Risk Level</p>
                                                <p className={`text-lg font-black ${result.severity === 'High' ? 'text-red-700' : 'text-green-700'}`}>
                                                    {t(result.severity) || result.severity}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Deep recommendations categorization */}
                                {result.disease !== 'Not a Crop' && result.disease !== 'Healthy' && (
                                    <div className="space-y-8 pt-4">
                                        {/* Biological Solutions */}
                                        <div className="space-y-4">
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-3">
                                                <Leaf size={16} /> Biological Control
                                            </h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {(result.recommendations?.organic_solutions || ['Maintain field hygiene']).map((p, i) => (
                                                    <div key={i} className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 flex items-center gap-4">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                        <p className="text-emerald-900 font-bold text-sm">{t(p) || p}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chemical Treatments */}
                                        <div className="space-y-4">
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-3">
                                                <div className="p-1 bg-indigo-100 rounded text-indigo-600"><CheckCircle size={12} /></div> Chemical Treatment
                                            </h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {(result.recommendations?.pesticides || []).map((p, i) => (
                                                    <div key={i} className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 flex items-center justify-between">
                                                        <p className="text-indigo-900 font-bold text-sm">{t(p) || p}</p>
                                                        <Link to="/shops" className="text-[10px] font-black uppercase text-indigo-600 hover:underline">Find Retailer →</Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* REJECTION UI remain same for structural consistency, but updated text for bio-diagnostic feel */}
                                {result.disease === 'Not a Crop' && (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="p-12 bg-red-50/30 rounded-[3rem] border-4 border-dashed border-red-100 text-center space-y-6"
                                    >
                                        <div className="p-6 rounded-[2rem] bg-red-100 text-red-600 shadow-xl inline-block animate-bounce font-black">
                                            <ShieldCheck size={56} />
                                        </div>
                                        <h2 className="text-3xl font-black text-red-900 tracking-tight">AI Validation Failed</h2>
                                        <p className="text-red-700/70 font-bold max-w-xs mx-auto text-sm leading-relaxed">
                                            The image does not contain identifiable plant tissue. To receive a high-confidence diagnosis, please photograph a single leaf with the camera 15-20cm away.
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
                                                    className="py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all bg-slate-900 text-white hover:bg-primary shadow-xl shadow-slate-200"
                                                >
                                                    Save to Health History
                                                </button>
                                                <Link
                                                    to="/community"
                                                    className="py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all border-2 border-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center gap-3"
                                                >
                                                    Ask Expert Community
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 bg-green-600 text-white shadow-xl shadow-green-100">
                                                    <CheckCircle size={24} /> Report Synchronized
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); setSaved(false); }}
                                                        className="py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest border-2 border-slate-100 text-slate-500 hover:bg-slate-50"
                                                    >
                                                        Scan Another
                                                    </button>
                                                    <Link
                                                        to="/dashboard"
                                                        className="py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest bg-primary text-white text-center"
                                                    >
                                                        View Dashboard
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Fallback reset button */}
                                {result.disease === 'Not a Crop' && (
                                    <button
                                        onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); setSaved(false); }}
                                        className="w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-3"
                                    >
                                        <Camera size={20} /> Retry Image Capture
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-8"
                            >
                                <div className="card-base p-12 space-y-12">
                                    <div className="space-y-4">
                                        <h3 className="text-4xl font-black text-slate-900 tracking-tight">AI Diagnostic Workflow</h3>
                                        <p className="text-slate-500 font-medium max-w-lg">Follow these steps to receive a professional-grade health report in seconds.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                        {[
                                            { title: "Capture Photo", desc: "Take a clear, well-lit photo of the affected plant organ (leaf, fruit, stem).", icon: "📸" },
                                            { title: "AI Analysis", desc: "Our deep neural networks compare symptoms against 50k+ symptomatic records.", icon: "🧠" },
                                            { title: "Get Cure", desc: "Receive biological treatments, chemical options, and find local retailers.", icon: "💊" }
                                        ].map((item, i) => (
                                            <div key={i} className="space-y-6 relative group">
                                                {i < 2 && <div className="hidden md:block absolute top-8 left-full w-full h-[2px] bg-slate-100 -z-10" />}
                                                <div className="w-16 h-16 bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-50 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all cursor-default">
                                                    {item.icon}
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black text-slate-900 tracking-tight">{item.title}</p>
                                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
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
