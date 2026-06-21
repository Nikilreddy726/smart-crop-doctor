import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, ShieldCheck, Globe, ChevronRight, Star, Leaf, Users, MessageSquare, BookOpen, Video, History, CloudSun, ShieldAlert, CheckCircle } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';

const Home = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleCTAClick = (e) => {
        e.preventDefault();
        if (user) {
            navigate('/detect');
        } else {
            navigate('/login', { state: { redirectUrl: '/detect' } });
        }
    };

    const handleFeatureClick = (path) => {
        if (user) {
            navigate(path);
        } else {
            navigate('/login', { state: { redirectUrl: path } });
        }
    };

    const features = [
        {
            icon: <Camera className="w-6 h-6 text-emerald-600" />,
            title: "AI Disease Detection",
            desc: "Identifies 40+ plant diseases with 95% accuracy! Upload a leaf photo to diagnose instantly.",
            badge: "95% Accuracy",
            path: "/detect"
        },
        {
            icon: <ShieldAlert className="w-6 h-6 text-indigo-600" />,
            title: "Expert Treatment Plans",
            desc: "Tailored organic and chemical treatment advice verified by agricultural scientists. 🌾",
            badge: "Expert Advisory",
            path: "/detect"
        },
        {
            icon: <Users className="w-6 h-6 text-blue-600" />,
            title: "Community Forum",
            desc: "Share your experience, discuss problems, and learn together with other farmers. 🗣️",
            badge: "Active Community",
            path: "/community"
        },
        {
            icon: <MessageSquare className="w-6 h-6 text-rose-600" />,
            title: "Live Consultations",
            desc: "Get in touch with qualified plant pathologists and agricultural experts in real time. 👨‍⚕️",
            badge: "Real-time Support",
            path: "/community"
        },
        {
            icon: <BookOpen className="w-6 h-6 text-amber-600" />,
            title: "Plant Encyclopedia",
            desc: "Searchable database containing detailed symptoms, preventions, and treatments for 100+ diseases. 📚",
            badge: "Comprehensive",
            path: "/schemes"
        },
        {
            icon: <Video className="w-6 h-6 text-orange-600" />,
            title: "Educational Videos",
            desc: "Learn modern organic farming, soil diagnostics, pest management, and cultivation tips. 🎥",
            badge: "Video Library",
            path: "/community"
        },
        {
            icon: <History className="w-6 h-6 text-teal-600" />,
            title: "Historical Tracking",
            desc: "Monitor plant health over time, view past predictions, and track your recovery rates. 📊",
            badge: "Secure Cloud",
            path: "/history"
        },
        {
            icon: <CloudSun className="w-6 h-6 text-cyan-600" />,
            title: "ML Agricultural Intelligence",
            desc: "Optimized crop yield predictions, soil data analysis, and hyper-local live weather parameters. 🌤️",
            badge: "Smart Analytics",
            path: "/weather"
        }
    ];

    return (
        <div className="space-y-24 pb-20">
            {/* 1. HERO SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[75vh] pt-6 px-4">
                {/* Left Content */}
                <div className="lg:col-span-7 space-y-8 text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-black tracking-wider uppercase border border-emerald-100"
                    >
                        <Star size={12} className="fill-emerald-600 text-emerald-600" />
                        🧠 Advanced AI Plant Health Analysis
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7.5xl font-black text-slate-900 leading-[1.05] tracking-tight"
                    >
                        AI-Powered <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">Disease Detection</span> For Your Crops 🌿
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 font-semibold text-sm md:text-base leading-relaxed max-w-xl"
                    >
                        Identify plant diseases early, get verified organic or chemical treatment recommendations instantly, and collaborate with top agricultural specialists. Protect your farm, increase crop yields, and maximize ROI.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
                    >
                        {/* Try AI Diagnosis Button (Styled exactly like user's provided button) */}
                        <button
                            onClick={handleCTAClick}
                            className="bg-[#306e40] hover:bg-[#255532] text-white py-4.5 px-8 rounded-2xl font-black text-lg shadow-xl shadow-emerald-800/10 flex items-center justify-between gap-6 transition-all transform active:scale-95 group text-center"
                        >
                            <span>Try AI Diagnosis</span>
                            <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={() => handleFeatureClick('/dashboard')}
                            className="border-2 border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-700 py-4.5 px-8 rounded-2xl font-black text-sm uppercase tracking-wider transition-all bg-white shadow-sm flex items-center justify-center gap-2"
                        >
                            Explore Dashboard
                        </button>
                    </motion.div>

                    {/* Quick trust metrics */}
                    <div className="flex items-center gap-6 pt-4 border-t border-slate-200/60 max-w-md">
                        <div className="space-y-1">
                            <p className="text-xl font-black text-slate-800">20k+</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Farmers</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="space-y-1">
                            <p className="text-xl font-black text-slate-800">95%</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy Rating</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="space-y-1">
                            <p className="text-xl font-black text-emerald-600">Free</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Scan Utility</p>
                        </div>
                    </div>
                </div>

                {/* Right Interactive Image Mockup (Clicking it triggers auth request) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-5 flex justify-center lg:justify-end"
                >
                    <div
                        onClick={handleCTAClick}
                        className="relative w-full max-w-[380px] aspect-[4/5] bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900 rounded-[2.5rem] p-4 shadow-2xl border-4 border-slate-800 hover:scale-[1.02] cursor-pointer transition-transform group overflow-hidden"
                    >
                        {/* Camera Interface Mockup */}
                        <div className="w-full h-full rounded-[2rem] bg-slate-900 border border-slate-850 overflow-hidden relative flex flex-col justify-between">
                            {/* Top info bar */}
                            <div className="p-4 bg-slate-950/60 backdrop-blur-md flex items-center justify-between text-white text-[10px] font-black uppercase tracking-widest border-b border-white/5 z-10">
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live Scanner</span>
                                <span>BIO-SCAN v8.0</span>
                            </div>

                            {/* Leaf background image with moving scan laser line */}
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&q=80&w=400"
                                    alt="Scanning leaf mockup"
                                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                                />
                                {/* Laser line overlay */}
                                <motion.div
                                    animate={{ y: [-150, 200, -150] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] z-10"
                                />
                            </div>

                            {/* Center Target Box */}
                            <div className="absolute inset-12 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 border-t-2 border-l-2 border-emerald-400 absolute top-0 left-0 rounded-tl-lg"></div>
                                <div className="w-8 h-8 border-t-2 border-r-2 border-emerald-400 absolute top-0 right-0 rounded-tr-lg"></div>
                                <div className="w-8 h-8 border-b-2 border-l-2 border-emerald-400 absolute bottom-0 left-0 rounded-bl-lg"></div>
                                <div className="w-8 h-8 border-b-2 border-r-2 border-emerald-400 absolute bottom-0 right-0 rounded-br-lg"></div>
                            </div>

                            {/* Bottom Card Mockup */}
                            <div className="p-4 bg-slate-950/80 backdrop-blur-md border-t border-white/5 space-y-3 z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Detected Crop</p>
                                        <p className="text-sm font-black text-white">Tomato Leaf</p>
                                    </div>
                                    <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                                        Verified
                                    </div>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className="w-11/12 h-full bg-emerald-400 rounded-full"></div>
                                </div>
                                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                                    <CheckCircle size={12} /> Click Mockup to Run Diagnostics
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 2. THE 8 KEY FEATURES SECTION */}
            <div className="space-y-12">
                <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                        Our Core Features & Services
                    </h2>
                    <p className="text-slate-500 text-sm md:text-base font-semibold leading-relaxed">
                        Explore the smart tools available in the Smart Crop Doctor ecosystem. Protecting crops and empowering farmers.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                    {features.map((feat, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -8 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            onClick={() => handleFeatureClick(feat.path)}
                            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md hover:shadow-xl cursor-pointer hover:border-emerald-200 transition-all flex flex-col justify-between h-[250px] relative group overflow-hidden"
                        >
                            {/* Top content */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
                                        {feat.icon}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                                        {feat.badge}
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                                        {feat.title}
                                    </h3>
                                    <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-3">
                                        {feat.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Link footer */}
                            <div className="flex items-center text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-emerald-600 transition-colors pt-2">
                                Learn More <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform ml-1" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 3. AI WORKFLOW - How Our AI Technology Works */}
            <div className="bg-[#f4fbf8] rounded-[3rem] py-16 px-6 md:px-12 mx-4 text-center">
                <div className="space-y-4 max-w-3xl mx-auto mb-16">
                    <span className="inline-block bg-[#e6f7ed] text-[#2e7d32] border border-[#c8e6c9] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                        🔍 AI Workflow
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-[#1b5e20] tracking-tight leading-none">
                        How Our AI Technology Works 🧠
                    </h2>
                    <p className="text-slate-600 text-sm md:text-base font-semibold leading-relaxed">
                        From image upload to diagnosis, our advanced AI processes your plant images using state-of-the-art computer vision techniques.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        {
                            num: "1",
                            emoji: "📷",
                            title: "Image Capture",
                            desc: "Take a clear photo of the affected plant part using your smartphone camera."
                        },
                        {
                            num: "2",
                            emoji: "🔄",
                            title: "AI Processing",
                            desc: "Our deep learning model extracts visual features and compares them against our disease database."
                        },
                        {
                            num: "3",
                            emoji: "🧪",
                            title: "Disease Analysis",
                            desc: "The AI identifies the disease with confidence scoring and severity assessment."
                        },
                        {
                            num: "4",
                            emoji: "✅",
                            title: "Expert Treatment",
                            desc: "Receive AI-generated treatment plans validated by agricultural scientists."
                        }
                    ].map((step, idx) => (
                        <div key={idx} className="space-y-6 flex flex-col items-center">
                            {/* Number circle */}
                            <div className="w-16 h-16 rounded-full bg-white border border-[#e8f5e9] flex items-center justify-center text-[#2e7d32] text-2xl font-black shadow-md">
                                {step.num}
                            </div>
                            
                            {/* Title with emoji */}
                            <h3 className="text-lg font-black text-[#1b5e20] flex items-center justify-center gap-2">
                                <span>{step.emoji}</span>
                                <span>{step.title}</span>
                            </h3>
                            
                            {/* Description */}
                            <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-[240px]">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. FINAL CTA BANNER */}
            <div className="mx-4 bg-gradient-to-tr from-emerald-800 to-emerald-950 rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none text-white">
                    <Leaf size={350} />
                </div>

                <div className="max-w-2xl mx-auto space-y-8 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
                        Start protecting your farm yields today! 🌿
                    </h2>
                    <p className="text-emerald-100/70 font-semibold text-sm md:text-base leading-relaxed">
                        Join thousands of farmers already using our local AI crop diagnosis. Instant, precise, and completely offline-capable leaf diagnostics in your pocket.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleCTAClick}
                            className="bg-white hover:bg-slate-50 text-emerald-900 py-4 px-8 rounded-2xl font-black text-sm uppercase tracking-wider transition-all transform active:scale-95 shadow-xl w-full sm:w-auto"
                        >
                            Try AI Diagnosis Now
                        </button>
                        <button
                            onClick={() => handleFeatureClick('/community')}
                            className="border-2 border-emerald-500/40 hover:border-emerald-400 text-white py-4 px-8 rounded-2xl font-black text-sm uppercase tracking-wider transition-all w-full sm:w-auto"
                        >
                            Talk to Pathologists
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
