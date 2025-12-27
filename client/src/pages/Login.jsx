import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, ShieldCheck, Sparkles, Chrome, ChevronRight } from 'lucide-react';
import { loginUser, registerUser, signInWithGoogle } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';
import { useEffect } from 'react';

const Login = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await loginUser(email, password);
            } else {
                await registerUser(email, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center bg-slate-50 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm"
            >
                <div className="card-base p-6 md:p-8 space-y-6 relative overflow-hidden backdrop-blur-sm bg-white/90 shadow-2xl">
                    <div className="text-center space-y-3">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-primary/5 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-primary"
                        >
                            {isLogin ? <LogIn size={24} /> : <UserPlus size={24} />}
                        </motion.div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                            {isLogin ? t('welcomeBack') : t('createAccount')}
                        </h1>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white border border-slate-200 hover:border-primary/20 hover:bg-slate-50 transition-all font-bold text-slate-700 shadow-sm text-xs"
                        >
                            <Chrome size={18} className="text-primary" />
                            {t('googleLogin')}
                        </button>

                        <div className="flex items-center gap-4 opacity-50">
                            <div className="h-px grow bg-slate-200"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('useEmail')}</span>
                            <div className="h-px grow bg-slate-200"></div>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="farmer@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 focus:border-primary/20 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('password')}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 focus:border-primary/20 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-xs"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-3 bg-red-50 rounded-xl text-red-600 text-[10px] font-black uppercase tracking-tight text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-3 rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4 disabled:bg-slate-300"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        {isLogin ? t('signIn') : t('joinNow')}
                                        <ChevronRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="text-center pt-1">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors tracking-tight uppercase"
                        >
                            {isLogin ? t('needAccount') : t('existingMember')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
