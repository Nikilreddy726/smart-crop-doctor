import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, ShieldCheck, Globe, ChevronRight, Star } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';

const Home = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-10">
            {/* Main Content Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-2xl p-6 md:p-16 flex flex-col items-center text-center space-y-10 relative overflow-hidden"
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <ShieldCheck size={400} />
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold bg-primary/5 py-2 px-5 rounded-full mx-auto w-fit">
                        <Star size={16} fill="currentColor" />
                        <span className="text-xs uppercase tracking-widest">{t('trustedBy')}</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tighter">
                        {t('welcome')}
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        {t('homeSubtitle')}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-5 relative z-10 w-full md:w-auto px-4 md:px-0">
                    <Link to="/detect" className="btn-primary text-lg md:text-xl w-full md:w-auto py-4 md:py-5 flex items-center justify-center gap-3 group shadow-primary/20 shadow-2xl">
                        <Camera size={24} className="group-hover:rotate-12 transition-transform" />
                        {t('startDiagnosis')}
                    </Link>
                    <Link to="/weather" className="btn-outline text-lg md:text-xl w-full md:w-auto py-4 md:py-5 flex items-center justify-center gap-3 group">
                        {t('viewWeather')}
                        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Feature Pills */}
                <div className="grid grid-cols-3 gap-4 md:gap-8 pt-10 relative z-10 w-full border-t border-slate-100">
                    {[
                        { icon: <ShieldCheck size={20} />, label: t('accuracy') },
                        { icon: <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 bg-red-500 rounded-full" />, label: t('instantReport') },
                        { icon: <Globe size={20} />, label: t('expertHelp') }
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row items-center justify-center gap-2 font-black text-slate-400 text-[10px] md:text-xs uppercase tracking-widest">
                            <span className="text-primary">{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 text-slate-400 font-bold text-[10px] tracking-widest uppercase flex items-center gap-3"
            >
                <span className="h-px w-8 bg-slate-200"></span>
                {t('secureCloud')}
                <span className="h-px w-8 bg-slate-200"></span>
            </motion.p>
        </div>
    );
};

export default Home;
