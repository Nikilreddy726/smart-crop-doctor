import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle, Info, Sparkles, X, ShieldCheck, Camera, ImageIcon } from 'lucide-react';
import { detectDisease } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../services/LanguageContext';

const Detection = () => {
    const { t } = useLanguage();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
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

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setLoading(true);
        setResult(null); // Clear previous result
        setSaved(false);
        try {
            console.log("Sending image for analysis...");
            const response = await detectDisease(selectedFile);
            console.log("Detection response:", response);

            if (response && response.disease) {
                setResult(response);
            } else {
                console.error("Invalid response:", response);
                alert("Received invalid response from server. Please try again.");
            }
        } catch (error) {
            console.error("Detection Error:", error);
            alert("Failed to analyze image. Error: " + (error.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase"
                >
                    <Sparkles size={14} /> Neural-Net Diagnostics
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{t('aiCropDoctor')}</h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">{t('detectionSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start h-full">
                {/* Upload Panel */}
                <motion.div layout className="card-base p-6 md:p-10 h-full flex flex-col justify-center min-h-[400px] md:min-h-[500px]">
                    {!preview ? (
                        <label
                            className={`group relative w-full h-full min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center border-4 border-dashed rounded-[2rem] md:rounded-[3rem] cursor-pointer transition-all duration-500 ${isDragging
                                ? 'border-primary bg-primary/5 scale-105'
                                : 'border-slate-100 hover:border-primary/20 hover:bg-slate-50'
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
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={handleUpload}
                                        className="w-full btn-primary py-6 rounded-2xl text-xl font-black shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                                    >
                                        <Sparkles size={24} />
                                        {t('analyzeInfection')}
                                    </motion.button>
                                )}

                                {loading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center gap-4 py-4"
                                    >
                                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-primary font-black animate-pulse tracking-widest text-xs uppercase">{t('computing')}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>

                {/* Response / Info Panel */}
                <div className="h-full">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white p-10 md:p-12 rounded-[4rem] border border-slate-200 shadow-2xl space-y-8"
                            >
                                {/* Disease Header */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-2xl ${result.severity === 'None' || result.disease === 'Healthy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {result.severity === 'None' || result.disease === 'Healthy' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{t(result.disease) || result.disease}</h2>
                                    </div>

                                    {/* Key Info Cards */}
                                    {result.disease !== 'Not a Crop' && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">🌱 {t('cropName') || 'Crop'}</p>
                                                <p className="text-lg font-black text-blue-700 mt-1">{t(result.crop) || result.crop || result.disease.split(' ')[0]}</p>
                                            </div>
                                            <div className={`p-4 rounded-2xl border ${result.severity === 'High' ? 'bg-red-50 border-red-100' :
                                                result.severity === 'Medium' ? 'bg-orange-50 border-orange-100' :
                                                    result.severity === 'Low' ? 'bg-yellow-50 border-yellow-100' :
                                                        'bg-green-50 border-green-100'
                                                }`}>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">⚠️ {t('severity') || 'Severity'}</p>
                                                <p className={`text-lg font-black mt-1 ${result.severity === 'High' ? 'text-red-700' :
                                                    result.severity === 'Medium' ? 'text-orange-700' :
                                                        result.severity === 'Low' ? 'text-yellow-700' :
                                                            'text-green-700'
                                                    }`}>{t(result.severity) || result.severity || 'None'}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🎯 {t('confidence')}</p>
                                                <p className="text-lg font-black text-primary mt-1">{(result.confidence * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Recommendations Section */}
                                {result.severity !== 'None' && result.disease !== 'Healthy' && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                                                <div className="h-px bg-slate-100 grow"></div>
                                                💊 {t('recommendedRecovery')}
                                                <div className="h-px bg-slate-100 grow"></div>
                                            </h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {result.recommendations?.pesticides?.map((p, i) => (
                                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                        <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center text-primary border border-slate-200 font-bold shrink-0 text-sm">{i + 1}</div>
                                                        <p className="text-slate-600 font-bold leading-snug self-center">{p}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                                                <div className="h-px bg-slate-100 grow"></div>
                                                🌿 {t('biologicalMeasures')}
                                                <div className="h-px bg-slate-100 grow"></div>
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {result.recommendations?.preventive_steps?.map((p, i) => (
                                                    <span key={i} className="bg-primary/5 text-primary px-4 py-2 rounded-xl text-xs font-black tracking-tight">{p}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {result.recommendations?.organic_solutions?.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="font-black text-sm uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                                                    <div className="h-px bg-slate-100 grow"></div>
                                                    🍃 {t('organicSolutions') || 'Organic Solutions'}
                                                    <div className="h-px bg-slate-100 grow"></div>
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.recommendations.organic_solutions.map((p, i) => (
                                                        <span key={i} className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-black tracking-tight border border-green-100">{p}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Not a Crop / Invalid Image Message */}
                                {result.disease === 'Not a Crop' && (
                                    <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100 text-center space-y-3">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 mb-2">
                                            <Info size={24} />
                                        </div>
                                        <p className="text-lg font-black text-yellow-800">No Crop Detected</p>
                                        <p className="text-sm text-yellow-700 font-medium">
                                            We could not identify a plant in this image. Please ensure you are finding the picture of a crop leaf or stem with good lighting.
                                        </p>
                                    </div>
                                )}

                                {/* Healthy Plant Message */}
                                {(result.severity === 'None' || result.disease === 'Healthy') && result.disease !== 'Not a Crop' && (
                                    <div className="p-6 bg-green-50 rounded-2xl border border-green-100 text-center">
                                        <p className="text-lg font-bold text-green-700">🎉 {t('healthyMessageTitle') || 'Great News! Your plant appears healthy.'}</p>
                                        <p className="text-sm text-green-600 mt-2">{t('healthyMessageBody') || 'Continue regular monitoring and care for best results.'}</p>
                                    </div>
                                )}

                                {/* Save Button with Explanation */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setSaved(true)}
                                        disabled={saved}
                                        className={`w-full py-5 rounded-[2rem] font-bold text-lg transition-all shadow-2xl flex items-center justify-center gap-3 ${saved
                                            ? 'bg-green-600 text-white shadow-green-200 cursor-default'
                                            : 'bg-slate-900 text-white hover:bg-primary shadow-slate-200'
                                            }`}
                                    >
                                        {saved ? (
                                            <>
                                                <CheckCircle size={20} />
                                                Report Cloud-Synced
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck size={20} />
                                                {t('saveToCloud')}
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-xs text-slate-400 font-medium">
                                        {saved ? '✅ Verified & stored in your secure history' : '💾 This saves your diagnosis report to your account for future reference'}
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-8"
                            >
                                <div className="card-base p-12 space-y-8">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t('howItWorks')}</h3>
                                    <div className="space-y-10">
                                        {[
                                            { title: t('singleSubject'), desc: t('singleSubjectDesc'), step: "🎯" },
                                            { title: t('naturalLight'), desc: t('naturalLightDesc'), step: "☀️" },
                                            { title: t('highContext'), desc: t('highContextDesc'), step: "🌿" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-6 items-start">
                                                <span className="text-4xl">{item.step}</span>
                                                <div className="space-y-2">
                                                    <p className="text-lg font-black text-slate-900">{item.title}</p>
                                                    <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
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
