import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, Sparkles, Chrome, ChevronRight, User, KeyRound, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { loginUser, registerUser, signInWithGoogle, resetPassword } from '../services/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';
import { useEffect } from 'react';

const Login = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            const dest = location.state?.redirectUrl || '/dashboard';
            navigate(dest, { replace: true });
        }
    }, [user, navigate, location]);

    const [isLogin, setIsLogin] = useState(true);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const getFriendlyError = (error) => {
        const code = error.code || '';
        const msg = error.message || error.toString();

        // Wrong password / invalid credentials
        if (code === 'auth/invalid-credential' || msg.includes('auth/invalid-credential')) {
            return {
                icon: <XCircle size={16} className="text-red-500 shrink-0" />,
                title: '🔒 Incorrect Email or Password',
                desc: 'The email or password you entered doesn\'t match our records. Please double-check and try again, or create a new account.'
            };
        }
        if (code === 'auth/user-not-found' || msg.includes('auth/user-not-found')) {
            return {
                icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
                title: '👤 Account Not Found',
                desc: 'We couldn\'t find an account with this email. Please check your email or register a new account.'
            };
        }
        if (code === 'auth/wrong-password' || msg.includes('auth/wrong-password')) {
            return {
                icon: <XCircle size={16} className="text-red-500 shrink-0" />,
                title: '🔑 Wrong Password',
                desc: 'The password you entered is incorrect. Try again or use "Forgot Password" to reset it.'
            };
        }
        if (code === 'auth/email-already-in-use' || msg.includes('auth/email-already-in-use')) {
            return {
                icon: <Info size={16} className="text-blue-500 shrink-0" />,
                title: '📧 Email Already Registered',
                desc: 'This email is already associated with an account. Please login instead or use a different email.'
            };
        }
        if (code === 'auth/weak-password' || msg.includes('auth/weak-password')) {
            return {
                icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
                title: '⚠️ Weak Password',
                desc: 'Password should be at least 6 characters long. Use a mix of letters, numbers, and symbols for better security.'
            };
        }
        if (code === 'auth/invalid-email' || msg.includes('auth/invalid-email')) {
            return {
                icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
                title: '✉️ Invalid Email Format',
                desc: 'Please enter a valid email address (e.g., farmer@email.com) or a 10-digit mobile number.'
            };
        }
        if (code === 'auth/too-many-requests' || msg.includes('auth/too-many-requests')) {
            return {
                icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
                title: '⏳ Too Many Attempts',
                desc: 'Access temporarily blocked due to too many failed login attempts. Please wait a few minutes and try again, or reset your password.'
            };
        }
        if (code === 'auth/network-request-failed' || msg.includes('auth/network-request-failed')) {
            return {
                icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
                title: '🌐 Network Error',
                desc: 'Unable to connect. Please check your internet connection and try again.'
            };
        }
        // Custom app errors (thrown by our validation)
        if (msg === t('mobileMustBe10') || msg === t('validEmailOrPhone') || msg === t('passwordsDoNotMatch')) {
            return {
                icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
                title: '⚠️ Validation Error',
                desc: msg
            };
        }
        return {
            icon: <XCircle size={16} className="text-red-500 shrink-0" />,
            title: '❌ Something Went Wrong',
            desc: 'An unexpected error occurred. Please try again later.'
        };
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            let authIdentifier = email.trim();
            const containsOnlyDigits = /^\d+$/.test(authIdentifier);
            const phoneRegex = /^[0-9]{10}$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (containsOnlyDigits) {
                if (!phoneRegex.test(authIdentifier)) {
                    throw new Error(t('mobileMustBe10'));
                }
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
            localStorage.removeItem('local_crop_scans');
            const dest = location.state?.redirectUrl || '/dashboard';
            navigate(dest);
        } catch (err) {
            console.error(err);
            setError(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setSuccessMsg('');
        try {
            await signInWithGoogle();
            localStorage.removeItem('local_crop_scans');
            const dest = location.state?.redirectUrl || '/dashboard';
            navigate(dest);
        } catch (err) {
            console.error(err);
            setError(getFriendlyError(err));
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            let resetIdentifier = resetEmail.trim();
            if (!resetIdentifier) {
                throw { code: 'auth/invalid-email' };
            }

            // Convert phone to shadow email
            const containsOnlyDigits = /^\d+$/.test(resetIdentifier);
            if (containsOnlyDigits) {
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(resetIdentifier)) {
                    throw new Error(t('mobileMustBe10'));
                }
                resetIdentifier = `${resetIdentifier}@farmer.com`;
            }

            await resetPassword(resetIdentifier);
            setSuccessMsg('✅ Password reset email sent! Check your inbox (and spam folder) for a link to reset your password.');
            setResetEmail('');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError({
                    icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
                    title: '👤 Account Not Found',
                    desc: 'No account exists with this email. Please check the email or register a new account.'
                });
            } else {
                setError(getFriendlyError(err));
            }
        } finally {
            setResetLoading(false);
        }
    };

    // Forgot Password View
    if (showForgotPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm"
                >
                    <div className="card-base p-6 md:p-8 space-y-6 relative overflow-hidden backdrop-blur-sm bg-white/90 shadow-2xl">
                        {/* Header */}
                        <div className="text-center space-y-3">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-amber-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-amber-600"
                            >
                                <KeyRound size={24} />
                            </motion.div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                                Reset Password
                            </h1>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                Enter your registered email or phone number. We'll send you a link to reset your password.
                            </p>
                        </div>

                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                    Email / Phone
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        placeholder="Enter your registered email or phone"
                                        value={resetEmail}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^\d+$/.test(val) && val.length > 10) return;
                                            setResetEmail(val);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-100 focus:border-amber-300 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Success Message */}
                            <AnimatePresence>
                                {successMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl"
                                    >
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-emerald-700 text-[11px] font-bold leading-relaxed">
                                                {successMsg}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-3 bg-red-50 border border-red-200 rounded-xl"
                                    >
                                        <div className="flex items-start gap-2">
                                            {error.icon}
                                            <div>
                                                <p className="text-red-700 text-[11px] font-black">{error.title}</p>
                                                <p className="text-red-500 text-[10px] font-semibold mt-0.5 leading-relaxed">{error.desc}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={resetLoading}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-amber-200 flex items-center justify-center gap-2 transition-all disabled:bg-slate-300"
                            >
                                {resetLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Send Reset Link
                                        <ChevronRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="text-center pt-1">
                            <button
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setError('');
                                    setSuccessMsg('');
                                }}
                                className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors tracking-tight uppercase flex items-center justify-center gap-1 mx-auto"
                            >
                                <ArrowLeft size={12} />
                                Back to Login
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Main Login / Register View
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
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('password')}</label>
                                    {isLogin && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForgotPassword(true);
                                                setResetEmail(email);
                                                setError('');
                                                setSuccessMsg('');
                                            }}
                                            className="text-[10px] font-black text-primary hover:text-emerald-700 transition-colors tracking-tight"
                                        >
                                            Forgot Password?
                                        </button>
                                    )}
                                </div>
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

                            {/* Rich Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-3 bg-red-50 border border-red-200 rounded-xl"
                                    >
                                        <div className="flex items-start gap-2">
                                            {error.icon}
                                            <div>
                                                <p className="text-red-700 text-[11px] font-black">{error.title}</p>
                                                <p className="text-red-500 text-[10px] font-semibold mt-0.5 leading-relaxed">{error.desc}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Success Message (e.g. after password reset) */}
                            <AnimatePresence>
                                {successMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl"
                                    >
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-emerald-700 text-[11px] font-bold leading-relaxed">
                                                {successMsg}
                                            </p>
                                        </div>
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
                            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
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
