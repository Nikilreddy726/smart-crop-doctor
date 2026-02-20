import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, ShieldCheck, Sparkles, Chrome, ChevronRight, User } from 'lucide-react';
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
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const getFriendlyErrorMessage = (error) => {
        const msg = error.message || error.toString();
        if (msg.includes('auth/invalid-credential') || error.code === 'auth/invalid-credential') {
            return t('invalidCredential');
        }
        if (msg.includes('auth/user-not-found') || error.code === 'auth/user-not-found') {
            return t('userNotFound');
        }
        if (msg.includes('auth/wrong-password') || error.code === 'auth/wrong-password') {
            return t('wrongPassword');
        }
        if (msg.includes('auth/email-already-in-use') || error.code === 'auth/email-already-in-use') {
            return t('emailInUse');
        }
        if (msg.includes('auth/weak-password') || error.code === 'auth/weak-password') {
            return t('weakPassword');
        }
        if (msg.includes('auth/invalid-email') || error.code === 'auth/invalid-email') {
            return t('invalidEmail');
        }
        return t('genericError');
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Determine if input is Email or Phone
            let authIdentifier = email.trim();
            const containsOnlyDigits = /^\d+$/.test(authIdentifier);
            const phoneRegex = /^[0-9]{10}$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (containsOnlyDigits) {
                if (!phoneRegex.test(authIdentifier)) {
                    throw new Error(t('mobileMustBe10'));
                }
                // It's a valid phone number -> Convert to shadow email
                authIdentifier = `${authIdentifier}@farmer.com`;
            } else if (!emailRegex.test(authIdentifier)) {
                throw new Error(t('validEmailOrPhone'));
            }

            if (isLogin) {
                await loginUser(authIdentifier, password);
            } else {
                if (password !== confirmPassword) {
                    throw new Error(t('passwordsDoNotMatch'));
                }
                await registerUser(authIdentifier, password, name);
            }
            localStorage.removeItem('local_crop_scans'); // Ensure fresh start
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            localStorage.removeItem('local_crop_scans');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 overflow-y-auto">
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
                            {!isLogin && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('fullName')}</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            required
                                            placeholder={t('yourName')}
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 focus:border-primary/20 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('emailPhone')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        placeholder={t('emailPhonePlaceholder')}
                                        value={email}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^\d+$/.test(val) && val.length > 10) return;
                                            setEmail(val);
                                        }}
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

                            {!isLogin && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('confirmPasswordLabel')}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 focus:border-primary/20 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-xs"
                                        />
                                    </div>
                                </div>
                            )}

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
