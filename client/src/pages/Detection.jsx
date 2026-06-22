import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertTriangle, Info, Sparkles, X, ShieldCheck, Camera, Leaf, Activity, AlertCircle, TestTube, Droplets, ArrowRight, ScanLine, Microscope, FlaskConical, Zap, FileCheck, ChevronRight, RotateCcw, Save, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { savePrediction } from '../services/api';
import { verifyPlantImage } from '../services/imageVerification';
import { EnhancedAIService } from '../services/enhancedAIService';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';

const STEPS = [
    { icon: Camera, label: 'Image Capture', desc: 'Photo loaded & validated' },
    { icon: ScanLine, label: 'Pixel Analysis', desc: 'Texture & pattern scan' },
    { icon: Microscope, label: 'Disease Match', desc: 'Comparing disease database' },
    { icon: FlaskConical, label: 'Risk Assessment', desc: 'Severity classification' },
    { icon: FileCheck, label: 'Report Ready', desc: 'Treatment plan generated' },
];

const Detection = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isValidPlant, setIsValidPlant] = useState(true);
    const [verificationMessage, setVerificationMessage] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [processingStage, setProcessingStage] = useState(0);
    const [processingMessage, setProcessingMessage] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const processFile = async (file) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const tempUrl = URL.createObjectURL(file);
            setPreview(tempUrl);
            setResult(null);
            setSaved(false);
            setIsValidPlant(true);
            setVerificationMessage(null);
            setIsVerifying(true);
            try {
                const { isPlant, message } = await verifyPlantImage(tempUrl);
                setIsValidPlant(isPlant);
                setVerificationMessage(isPlant ? null : message);
            } catch (err) {
                setIsValidPlant(true);
            } finally {
                setIsVerifying(false);
            }
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
        if (!preview) return;
        setLoading(true);
        setResult(null);
        setSaved(false);
        setProcessingStage(0);
        setProcessingMessage('');
        try {
            const analysisResult = await EnhancedAIService.analyzeImage(preview, (stage, msg) => {
                setProcessingStage(stage);
                setProcessingMessage(msg);
            });
            setResult(analysisResult);
        } catch (error) {
            setResult({ __error: true, message: `Could not analyse the image: ${error.message}` });
        } finally {
            setLoading(false);
            setProcessingStage(0);
            setProcessingMessage('');
        }
    };

    const handleSave = async () => {
        if (!result || result.disease === 'Not a Crop') return;
        try {
            setSaved(true);
            let recordId = result.id || 'local-' + Date.now();
            const newRecord = {
                id: recordId,
                disease: result.disease,
                crop: result.crop,
                severity: result.severity,
                confidence: result.confidence,
                recommendations: result.recommendations,
                imageUrl: result.imageUrl || 'image-not-stored',
                timestamp: new Date().toISOString()
            };
            if (user) {
                try {
                    const response = await savePrediction({ userId: user.uid, ...newRecord });
                    if (response && response.id) newRecord.id = response.id;
                } catch (cloudErr) { console.error('Cloud save failed:', cloudErr); }
            }
            const storageKey = user ? `local_crop_scans_${user.uid}` : 'local_crop_scans';
            const raw = localStorage.getItem(storageKey);
            let history = [];
            try { if (raw) history = JSON.parse(raw); } catch (e) { history = []; }
            history.unshift(newRecord);
            localStorage.setItem(storageKey, JSON.stringify(history.slice(0, 50)));
        } catch (err) { console.error('Save error:', err); }
    };

    const resetAll = () => {
        setSelectedFile(null);
        setPreview(null);
        setResult(null);
        setSaved(false);
        setIsValidPlant(true);
        setVerificationMessage(null);
    };

    const severityColor = (s) => {
        if (s === 'High' || s === 'Critical') return { bg: 'from-rose-500 to-red-600', light: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
        if (s === 'Medium' || s === 'Moderate') return { bg: 'from-amber-400 to-orange-500', light: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
        return { bg: 'from-emerald-400 to-green-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    };

    const isHealthy = result && (result.severity === 'None' || result.disease === 'Healthy');
    const sev = result ? severityColor(result.severity) : null;

    return (
        <div className="max-w-7xl mx-auto pb-24 px-2 sm:px-4">

            {/* ── PAGE HEADER ───────────────────────────────── */}
            <div className="text-center mb-10 space-y-3">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-100"
                >
                    <Zap size={11} className="fill-emerald-600" /> Neural-Net Diagnostics · BIO-SCAN v8.0
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight"
                >
                    AI Crop Disease <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">Scanner</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-500 text-sm font-medium max-w-md mx-auto"
                >
                    Upload a leaf photo — our deep learning model diagnoses 40+ diseases in seconds.
                </motion.p>
            </div>

            {/* ── MAIN GRID ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* ── LEFT: UPLOAD PANEL ─────────────────── */}
                <div className="lg:col-span-5 space-y-5">
                    <motion.div layout className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white">

                        {/* Upload Zone Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase">Live Scanner</span>
                            </div>
                            <span className="text-slate-400 text-[10px] font-black tracking-widest">BIO-SCAN V8.0</span>
                        </div>

                        {/* Drop Zone / Preview */}
                        <div className="p-5">
                            {!preview ? (
                                <label
                                    className={`relative flex flex-col items-center justify-center min-h-[320px] rounded-2xl border-3 border-dashed cursor-pointer transition-all duration-300 ${isDragging
                                        ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 bg-slate-50/50'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="flex flex-col items-center gap-5 text-center p-6 pointer-events-none">
                                        <motion.div
                                            animate={{ y: isDragging ? -8 : 0 }}
                                            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-emerald-500' : 'bg-slate-100'}`}
                                        >
                                            <Camera size={36} className={isDragging ? 'text-white' : 'text-emerald-600'} />
                                        </motion.div>
                                        <div>
                                            <p className="text-xl font-black text-slate-800">
                                                {isDragging ? '📂 Drop to Scan!' : '📸 Upload Leaf Photo'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1 font-semibold">Drag & drop or click to browse</p>
                                            <p className="text-[10px] text-slate-300 mt-0.5">JPG, PNG, WEBP — up to 10MB</p>
                                        </div>
                                        <div className="flex gap-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg">🌿 Leaf</span>
                                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg">☀️ Good Lighting</span>
                                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg">🔍 Close-up</span>
                                        </div>
                                    </div>
                                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </label>
                            ) : (
                                <div className="space-y-4">
                                    {/* Image Preview */}
                                    <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-900 shadow-lg border border-slate-800">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />

                                        {/* Scan overlay when verifying */}
                                        {isVerifying && (
                                            <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center gap-3">
                                                <div className="w-10 h-10 border-4 border-white border-t-emerald-400 rounded-full animate-spin" />
                                                <p className="text-white text-xs font-black uppercase tracking-wider">Verifying...</p>
                                            </div>
                                        )}

                                        {/* Scanning animation */}
                                        {loading && (
                                            <motion.div
                                                animate={{ y: ['-100%', '200%'] }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399]"
                                            />
                                        )}

                                        {/* Corner brackets */}
                                        <div className="absolute inset-6 pointer-events-none">
                                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                                        </div>

                                        {/* Invalid plant warning */}
                                        {!isValidPlant && verificationMessage && !isVerifying && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 backdrop-blur-sm text-white p-3 text-[11px] font-bold flex items-center gap-2">
                                                <AlertCircle size={14} className="shrink-0" />
                                                <span>{verificationMessage}</span>
                                            </div>
                                        )}

                                        {/* Reset button */}
                                        <button
                                            onClick={resetAll}
                                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-slate-700 hover:bg-red-500 hover:text-white transition-all shadow-lg z-10"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Analyze Button */}
                                    {!result && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={handleUpload}
                                            disabled={loading || isVerifying}
                                            className={`w-full py-4 rounded-2xl font-black text-base tracking-wide shadow-xl flex items-center justify-center gap-3 transition-all text-white ${loading || isVerifying
                                                ? 'bg-slate-400 cursor-not-allowed'
                                                : !isValidPlant
                                                    ? 'bg-amber-500 hover:bg-amber-600 active:scale-95'
                                                    : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 active:scale-95 shadow-emerald-200'
                                                }`}
                                        >
                                            {loading || isVerifying ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Sparkles size={20} />
                                            )}
                                            {loading ? 'Analyzing...' : isVerifying ? 'Verifying Image...' : !isValidPlant ? '⚠️ Analyze Anyway' : '🔬 Analyze Disease'}
                                        </motion.button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Processing Progress Bar */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-black text-slate-800">Processing...</p>
                                    <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Stage {processingStage}/5</p>
                                </div>

                                {/* Step indicators */}
                                <div className="space-y-2.5">
                                    {STEPS.map((step, i) => {
                                        const done = i < processingStage;
                                        const active = i === processingStage - 1;
                                        const Icon = step.icon;
                                        return (
                                            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${active ? 'bg-emerald-50 border border-emerald-200' : done ? 'opacity-60' : 'opacity-30'}`}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                    {done ? <CheckCircle size={14} /> : <Icon size={13} />}
                                                </div>
                                                <div>
                                                    <p className={`text-[11px] font-black ${active ? 'text-emerald-700' : 'text-slate-600'}`}>{step.label}</p>
                                                    {active && <p className="text-[9px] text-emerald-500 font-semibold animate-pulse">{processingMessage || step.desc}</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(processingStage / 5) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick Tips (show when no image) */}
                    {!preview && (
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📋 Photo Tips</p>
                            {[
                                ['🌿', 'Focus on the affected leaf or stem'],
                                ['☀️', 'Use natural daylight, avoid flash'],
                                ['📐', 'Keep 15–20 cm distance from the leaf'],
                                ['🖼️', 'Avoid cluttered backgrounds'],
                            ].map(([emoji, tip], i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-base">{emoji}</span>
                                    <p className="text-slate-300 text-xs font-semibold">{tip}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: RESULTS PANEL ─────────────────── */}
                <div className="lg:col-span-7">
                    <AnimatePresence mode="wait">

                        {/* ── STATE: NO IMAGE YET ─── */}
                        {!preview && !result && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-5"
                            >
                                {/* 3-step workflow */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                                    <div className="bg-gradient-to-r from-emerald-700 to-green-600 p-5">
                                        <p className="text-white font-black text-sm">How It Works</p>
                                        <p className="text-emerald-100/70 text-xs mt-0.5">Professional-grade diagnosis in 3 steps</p>
                                    </div>
                                    <div className="p-5 space-y-5">
                                        {[
                                            { step: '01', icon: Camera, color: 'bg-blue-50 text-blue-600', title: 'Capture Photo', desc: 'Take a clear, close-up photo of the affected plant part — leaf, stem, or fruit.' },
                                            { step: '02', icon: Sparkles, color: 'bg-purple-50 text-purple-600', title: 'AI Analysis', desc: 'Our deep learning model scans 50+ visual patterns to identify the exact disease.' },
                                            { step: '03', icon: FileCheck, color: 'bg-emerald-50 text-emerald-600', title: 'Get Treatment Plan', desc: 'Receive expert-validated organic and chemical treatment recommendations instantly.' },
                                        ].map((item, i) => {
                                            const Icon = item.icon;
                                            return (
                                                <div key={i} className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-300 tracking-widest">STEP {item.step}</span>
                                                        </div>
                                                        <p className="text-sm font-black text-slate-900">{item.title}</p>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">{item.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Supported crops */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow p-5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🌾 Supported Crops & Diseases</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Tomato', 'Potato', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Chilli', 'Onion', 'Beans', 'Grapes', '+ more'].map((c, i) => (
                                            <span key={i} className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-100">{c}</span>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-3">✅ Detects 40+ diseases · 95% accuracy · Free to use</p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STATE: ERROR ─── */}
                        {result && result.__error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-orange-50 border-2 border-orange-200 p-10 rounded-3xl shadow-xl flex flex-col items-center gap-5 text-center"
                            >
                                <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center">
                                    <Sparkles size={36} className="text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-orange-800 mb-2">⏳ AI is Waking Up</h3>
                                    <p className="text-orange-700 font-semibold text-sm leading-relaxed max-w-sm">{result.message}</p>
                                    <p className="text-orange-500 text-xs mt-2">Free tier restarts after inactivity — usually takes ~1 minute</p>
                                </div>
                                <button
                                    onClick={() => { setResult(null); handleUpload(); }}
                                    className="bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <RotateCcw size={16} /> Try Again
                                </button>
                            </motion.div>
                        )}

                        {/* ── STATE: RESULTS ─── */}
                        {result && !result.__error && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-5"
                            >
                                {/* ── DISEASE HEADER CARD ── */}
                                <div className={`rounded-3xl overflow-hidden shadow-xl border ${isHealthy ? 'border-emerald-200' : 'border-slate-200'}`}>
                                    {/* Gradient top bar */}
                                    <div className={`bg-gradient-to-r ${isHealthy ? 'from-emerald-500 to-green-500' : result.disease === 'Not a Crop' ? 'from-red-500 to-rose-600' : `${sev?.bg}`} p-6 text-white relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 opacity-10 -mt-4 -mr-4">
                                            {isHealthy ? <CheckCircle size={120} /> : <AlertTriangle size={120} />}
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black tracking-[0.2em] uppercase bg-white/20 px-2 py-0.5 rounded-full">BIO-SCAN 8.0 · DIAGNOSIS</span>
                                            </div>
                                            <h2 className="text-3xl font-black tracking-tight mt-2">
                                                {t(result.disease) || result.disease}
                                            </h2>
                                            {result.scientific_name && (
                                                <p className="text-white/70 italic text-sm font-semibold mt-1">{result.scientific_name}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Metrics row */}
                                    {result.disease !== 'Not a Crop' && (
                                        <div className="bg-white p-5 grid grid-cols-3 divide-x divide-slate-100">
                                            {[
                                                { label: 'Detected Crop', value: t(result.crop) || result.crop, icon: <Leaf size={14} className="text-emerald-600" /> },
                                                { label: 'Pathogen Type', value: result.pathogen || 'Biological', icon: <Activity size={14} className="text-indigo-500" /> },
                                                { label: 'Risk Level', value: t(result.severity) || result.severity, icon: <AlertCircle size={14} className={result.severity === 'High' ? 'text-rose-500' : result.severity === 'Medium' ? 'text-amber-500' : 'text-emerald-500'} />, colored: true },
                                            ].map((m, i) => (
                                                <div key={i} className="px-4 first:pl-0 last:pr-0 space-y-1">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {m.icon} {m.label}
                                                    </div>
                                                    <p className={`text-sm font-black ${m.colored ? (result.severity === 'High' ? 'text-rose-600' : result.severity === 'Medium' ? 'text-amber-600' : 'text-emerald-600') : 'text-slate-800'}`}>
                                                        {m.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ── CONFIDENCE BAR ── */}
                                {result.confidence && result.disease !== 'Not a Crop' && (
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Confidence Score</p>
                                            <p className="text-sm font-black text-emerald-700">{result.confidence}%</p>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <motion.div
                                                className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${result.confidence}%` }}
                                                transition={{ duration: 1, delay: 0.3 }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* ── NOT A CROP ── */}
                                {result.disease === 'Not a Crop' && (
                                    <div className="bg-red-50 rounded-2xl border-2 border-dashed border-red-200 p-8 text-center space-y-3">
                                        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                                            <ShieldCheck size={28} className="text-red-500" />
                                        </div>
                                        <h3 className="text-lg font-black text-red-800">Not a Plant Image</h3>
                                        <p className="text-red-600/70 text-xs font-semibold max-w-xs mx-auto leading-relaxed">
                                            The image doesn't contain identifiable plant tissue. Please photograph a leaf 15–20 cm away in good lighting.
                                        </p>
                                        <button onClick={resetAll} className="mt-2 bg-red-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wide hover:bg-red-600 active:scale-95 transition-all flex items-center gap-2 mx-auto">
                                            <Camera size={14} /> Retry Capture
                                        </button>
                                    </div>
                                )}

                                {/* ── TREATMENT PLANS ── */}
                                {result.disease !== 'Not a Crop' && result.disease !== 'Healthy' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Organic / Biological */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow overflow-hidden">
                                            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-3 flex items-center gap-2">
                                                <ShieldCheck size={16} className="text-emerald-700" />
                                                <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Biological Control</p>
                                            </div>
                                            <div className="p-4 space-y-2.5">
                                                {(result.recommendations?.organic_solutions || ['Regular monitoring']).map((p, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all">
                                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">{i + 1}</div>
                                                        <p className="text-slate-700 font-semibold text-xs leading-relaxed">{t(p) || p}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chemical Treatments */}
                                        <div className="bg-white rounded-2xl border border-slate-200 shadow overflow-hidden">
                                            <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 flex items-center gap-2">
                                                <FlaskConical size={16} className="text-indigo-700" />
                                                <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">Chemical Treatment</p>
                                            </div>
                                            <div className="p-4 space-y-2.5">
                                                {(result.recommendations?.pesticides || []).length > 0 ? (result.recommendations.pesticides.map((p, i) => (
                                                    <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group">
                                                        <div className="flex items-center gap-2.5">
                                                            <Droplets size={14} className="text-indigo-500 shrink-0" />
                                                            <p className="text-slate-700 font-semibold text-xs leading-relaxed">{t(p) || p}</p>
                                                        </div>
                                                        <Link to="/shops" className="shrink-0 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center gap-1">
                                                            Shop <ArrowRight size={10} />
                                                        </Link>
                                                    </div>
                                                ))) : (
                                                    <p className="text-slate-400 text-xs font-semibold p-3 text-center">No chemical treatment required.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── HEALTHY MESSAGE ── */}
                                {isHealthy && (
                                    <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 flex items-start gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                                            <CheckCircle size={24} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-emerald-800 text-base">Great News! Your plant looks healthy. 🌿</h3>
                                            <p className="text-emerald-700/70 text-xs font-semibold mt-1 leading-relaxed">
                                                No signs of disease detected. Continue regular monitoring and care for best results. Consider preventive spraying during humid seasons.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ── ACTION BUTTONS ── */}
                                {result.disease !== 'Not a Crop' && (
                                    <div className="space-y-3">
                                        {!saved ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={handleSave}
                                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-slate-900 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-slate-200 active:scale-95"
                                                >
                                                    <Save size={15} /> Save to History
                                                </button>
                                                <Link
                                                    to="/community"
                                                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border-2 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                                                >
                                                    <MessageSquare size={15} /> Ask Experts
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-emerald-500 text-white shadow-lg shadow-emerald-100">
                                                    <CheckCircle size={18} /> Report Saved Successfully!
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button onClick={resetAll} className="py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                                                        <Camera size={13} /> New Scan
                                                    </button>
                                                    <Link to="/dashboard" className="py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white text-center flex items-center justify-center gap-1.5 hover:bg-emerald-700">
                                                        <ChevronRight size={13} /> Dashboard
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                        <button onClick={resetAll} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                                            <RotateCcw size={11} /> Scan Another Leaf
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Detection;
