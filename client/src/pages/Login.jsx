import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Lock, LogIn, UserPlus, Chrome, ChevronRight, User,
    KeyRound, ArrowLeft, CheckCircle2, AlertTriangle, XCircle,
    Info, Phone, Shield, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import {
    signInWithPhoneNumber, RecaptchaVerifier,
    linkWithCredential, EmailAuthProvider,
    updatePassword, signOut, updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { loginUser, registerUser, signInWithGoogle, resetPassword } from '../services/firebase';
import { resetPasswordPhone, forgotPasswordPhone } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';

// ─── These are defined OUTSIDE Login so React never remounts the form ─────────

const getFriendlyError = (error) => {
    if (error?.response?.data?.error) {
        return { type: 'error', title: '❌ Error', desc: error.response.data.error };
    }
    const code = error?.code || '';
    const msg = error?.message || String(error);
    if (code === 'auth/invalid-credential' || msg.includes('auth/invalid-credential'))
        return { type: 'error', title: '🔒 Incorrect Email or Password', desc: "The email or password you entered doesn't match. Please try again or reset your password." };
    if (code === 'auth/user-not-found' || msg.includes('auth/user-not-found'))
        return { type: 'warn', title: '👤 Account Not Found', desc: 'No account with this email/phone. Check your details or create a new account.' };
    if (code === 'auth/wrong-password' || msg.includes('auth/wrong-password'))
        return { type: 'error', title: '🔑 Wrong Password', desc: 'Incorrect password. Try again or use Forgot Password.' };
    if (code === 'auth/email-already-in-use')
        return { type: 'info', title: '📧 Already Registered', desc: 'This email / phone is already registered. Please sign in instead.' };
    if (code === 'auth/weak-password')
        return { type: 'warn', title: '⚠️ Weak Password', desc: 'Password must be at least 6 characters long.' };
    if (code === 'auth/invalid-email')
        return { type: 'warn', title: '✉️ Invalid Email', desc: 'Please enter a valid email address.' };
    if (code === 'auth/too-many-requests')
        return { type: 'warn', title: '⏳ Too Many Attempts', desc: 'Access temporarily blocked. Wait a few minutes or reset your password.' };
    if (code === 'auth/network-request-failed')
        return { type: 'warn', title: '🌐 No Connection', desc: 'Check your internet connection and try again.' };
    if (code === 'auth/invalid-verification-code')
        return { type: 'error', title: '❌ Wrong OTP', desc: 'The OTP you entered is incorrect. Please check and try again.' };
    if (code === 'auth/code-expired')
        return { type: 'warn', title: '⏳ OTP Expired', desc: 'The OTP has expired. Please request a new one.' };
    if (code === 'auth/credential-already-in-use')
        return { type: 'info', title: '📱 Phone Already Linked', desc: 'This phone number is already associated with another account.' };
    // Phone Auth specific errors
    if (code === 'auth/app-not-authorized' || code === 'auth/operation-not-allowed')
        return { type: 'error', title: '🔧 Phone Auth Not Enabled', desc: 'Phone authentication is not enabled. Please go to Firebase Console → Authentication → Sign-in methods → Enable Phone.' };
    if (code === 'auth/invalid-phone-number')
        return { type: 'warn', title: '📱 Invalid Phone Number', desc: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).' };
    if (code === 'auth/missing-phone-number')
        return { type: 'warn', title: '📱 Phone Number Required', desc: 'Please enter your 10-digit mobile number.' };
    if (code === 'auth/quota-exceeded')
        return { type: 'warn', title: '📊 SMS Quota Exceeded', desc: 'Too many OTPs sent today. Please try again tomorrow or use email.' };
    if (code === 'auth/captcha-check-failed')
        return { type: 'warn', title: '🤖 Security Check Failed', desc: 'reCAPTCHA verification failed. Please refresh the page and try again.' };
    if (code === 'auth/billing-not-enabled')
        return { type: 'error', title: '💳 Firebase Billing Required', desc: 'Phone authentication requires Firebase Blaze plan. Please upgrade or use email login.' };
    // Show actual error code in catch-all to help debug
    return { type: 'error', title: '❌ Something Went Wrong', desc: `Error: ${code || msg}. Please try again or use email/Google to sign in.` };
};

const Banner = ({ msg, onClose }) => {
    if (!msg) return null;
    const isSuccess = msg.type === 'success';
    const isInfo = msg.type === 'info';
    const isWarn = msg.type === 'warn';
    const base = isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : isInfo ? 'bg-blue-50 border-blue-200 text-blue-700'
        : isWarn ? 'bg-amber-50 border-amber-200 text-amber-700'
        : 'bg-red-50 border-red-200 text-red-700';
    const Icon = isSuccess ? CheckCircle2 : isInfo ? Info : AlertTriangle;
    return (
        <div className={`p-3 border rounded-xl ${base}`}>
            <div className="flex items-start gap-2">
                <Icon size={15} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-[11px] font-black">{msg.title}</p>
                    {msg.desc && <p className="text-[10px] font-semibold mt-0.5 leading-relaxed opacity-80">{msg.desc}</p>}
                </div>
                {onClose && <button onClick={onClose} className="opacity-50 hover:opacity-100"><XCircle size={13} /></button>}
            </div>
        </div>
    );
};

const OtpInput = ({ value, onChange }) => {
    const inputs = useRef([]);
    const digits = (value + '      ').slice(0, 6).split('');

    const handleKey = (e, i) => {
        if (e.key === 'Backspace') {
            const next = digits.map(d => d.trim());
            if (next[i]) { next[i] = ''; onChange(next.join('').trim().padEnd(0)); }
            else if (i > 0) { inputs.current[i - 1]?.focus(); }
        }
    };

    const handleChange = (e, i) => {
        const val = e.target.value.replace(/\D/g, '').slice(-1);
        const arr = digits.map(d => d === ' ' ? '' : d);
        arr[i] = val;
        onChange(arr.join(''));
        if (val && i < 5) inputs.current[i + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted);
        inputs.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center">
            {[0, 1, 2, 3, 4, 5].map(i => {
                const d = (value[i] || '');
                return (
                    <input key={i} ref={el => inputs.current[i] = el}
                        type="text" inputMode="numeric" maxLength={1} value={d}
                        onChange={e => handleChange(e, i)} onKeyDown={e => handleKey(e, i)} onPaste={handlePaste}
                        className={`w-10 h-12 text-center text-lg font-black rounded-xl border-2 outline-none transition-all
                            ${d ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-800'}
                            focus:border-emerald-400 focus:bg-white`}
                    />
                );
            })}
        </div>
    );
};

// Wrapper layout — defined OUTSIDE Login to prevent remount on every render
const PageWrap = ({ children, mode }) => {
    return (
        <div className="min-h-[calc(100vh-180px)] flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-green-50 px-4 py-2">
            <div id="recaptcha-container" style={{ position: 'absolute' }}></div>
            
            <div className="w-full max-w-4xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px] md:h-[530px] my-1">


                {/* Left Side: Decorative Agriculture Hero Section */}
                <div className="md:col-span-5 relative overflow-hidden min-h-[160px] md:min-h-auto flex flex-col justify-between p-6 text-white bg-emerald-950">
                    {/* Background Tech Image */}
                    <div className="absolute inset-0 bg-cover bg-center transition-all duration-500" style={{ backgroundImage: "url('/agritech_hero_banner.jpg')" }}></div>
                    
                    {/* Shadow overlay only visible on desktop to ensure text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-transparent hidden md:block"></div>
                    
                    {/* Floating Glow Effects - Desktop only */}
                    <div className="absolute -top-10 -left-10 w-45 h-40 bg-emerald-400/20 rounded-full blur-3xl hidden md:block"></div>
                    <div className="absolute -bottom-20 -right-20 w-55 h-55 bg-green-400/20 rounded-full blur-3xl hidden md:block"></div>
                    
                    {/* Top Content: Brand (Desktop only) */}
                    <div className="relative z-10 space-y-1.5 hidden md:block">
                        <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <span className="text-[9px] font-black uppercase tracking-wider">AI Crop Doctor Active</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight mt-1 text-white">Smart Doctor Crop</h1>
                        <p className="text-[10px] text-emerald-100 font-bold tracking-wide uppercase">AI-Powered Crop Health Monitoring</p>
                    </div>

                    {/* Bottom Content: Info (Desktop only) */}
                    <div className="relative z-10 space-y-3 hidden md:block">
                        <p className="text-xs font-medium leading-relaxed text-emerald-50 opacity-90">
                            Monitor crop health, detect diseases early, receive intelligent recommendations, and improve farm productivity using AI.
                        </p>
                        
                        {/* Interactive mini badges */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                                <p className="text-[9px] font-black uppercase text-emerald-300">Accuracy</p>
                                <p className="text-base font-black mt-0.5">99.2%</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
                                <p className="text-[9px] font-black uppercase text-emerald-300">Diagnosis</p>
                                <p className="text-base font-black mt-0.5">Instant</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Side: Authentication Card */}
                <div className="md:col-span-7 p-6 md:py-6 md:px-8 flex flex-col justify-center bg-white/40 backdrop-blur-lg border-l border-white/20">
                    <div className="max-w-md w-full mx-auto space-y-3">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};



// ─── Main Login Component ──────────────────────────────────────────────────────
const Login = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) navigate(location.state?.redirectUrl || '/dashboard', { replace: true });
    }, [user, navigate, location]);

    useEffect(() => {
        const handleScrollLock = () => {
            if (window.innerWidth >= 768) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        };
        handleScrollLock();
        window.addEventListener('resize', handleScrollLock);
        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('resize', handleScrollLock);
        };
    }, []);


    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPass, setShowNewPass] = useState(false);
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [pendingPhone, setPendingPhone] = useState('');
    const [pendingCreds, setPendingCreds] = useState(null);
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [tempPhoneToken, setTempPhoneToken] = useState('');


    useEffect(() => {
        if (otpCountdown <= 0) return;
        const timer = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [otpCountdown]);

    const clearBanner = () => setBanner(null);
    const isPhone = (v) => /^\d{10}$/.test(v.trim());
    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    const shadow = (phone) => `${phone}@farmer.com`;

    const setupRecaptcha = () => {
        try { if (window._rcv) { window._rcv.clear(); window._rcv = null; } } catch (_) {}
        window._rcv = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
            'expired-callback': () => {
                console.warn('reCAPTCHA expired');
            }
        });
        return window._rcv;
    };

    const sendOTP = async (phone) => {
        const verifier = setupRecaptcha();
        await verifier.render();
        const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
        setConfirmationResult(result);
        setOtpCountdown(60);
        setPendingPhone(phone);
    };

    // ── Login / Register ──────────────────────────────────────────────
    const handleAuth = async (e) => {
        e.preventDefault();
        setBanner(null);
        setLoading(true);
        try {
            const id = email.trim();
            const phoneMode = isPhone(id);
            const emailMode = isEmail(id);
            if (!phoneMode && !emailMode) {
                setBanner({ type: 'warn', title: '✉️ Invalid Format', desc: 'Enter a valid email or 10-digit phone number.' });
                return;
            }
            const shadowEmail = phoneMode ? shadow(id) : id;

            if (mode === 'login') {
                await loginUser(shadowEmail, password);
                localStorage.removeItem('local_crop_scans');
                navigate(location.state?.redirectUrl || '/dashboard');
            } else {
                if (password !== confirmPassword) { setBanner({ type: 'warn', title: '🔑 Passwords Don\'t Match', desc: 'Both password fields must be identical.' }); return; }
                if (password.length < 6) { setBanner({ type: 'warn', title: '⚠️ Weak Password', desc: 'Password must be at least 6 characters.' }); return; }

                await registerUser(shadowEmail, password, name);
                localStorage.removeItem('local_crop_scans');
                navigate(location.state?.redirectUrl || '/dashboard');
            }

        } catch (err) {
            console.error('Auth error:', err);
            setBanner(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // ── OTP → Register ────────────────────────────────────────────────
    const handleOTPRegister = async (e) => {
        e.preventDefault();
        if (otp.replace(/\s/g, '').length < 6) { setBanner({ type: 'warn', title: '⚠️ Incomplete OTP', desc: 'Enter all 6 digits.' }); return; }
        setBanner(null);
        setLoading(true);
        try {
            const result = await confirmationResult.confirm(otp.replace(/\s/g, ''));
            const phoneUser = result.user;
            const { shadowEmail, password, name } = pendingCreds;
            try {
                const cred = EmailAuthProvider.credential(shadowEmail, password);
                await linkWithCredential(phoneUser, cred);
            } catch (linkErr) {
                if (linkErr.code === 'auth/email-already-in-use') {
                    await signOut(auth);
                    await loginUser(shadowEmail, password);
                    navigate(location.state?.redirectUrl || '/dashboard');
                    return;
                }
                throw linkErr;
            }
            if (name) await updateProfile(phoneUser, { displayName: name });
            await signOut(auth);
            await loginUser(shadowEmail, password);
            localStorage.removeItem('local_crop_scans');
            navigate(location.state?.redirectUrl || '/dashboard');
        } catch (err) {
            console.error('OTP register error:', err);
            setBanner(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // ── Forgot Password ───────────────────────────────────────────────
    const handleForgot = async (e) => {
        e.preventDefault();
        setBanner(null);
        setLoading(true);
        try {
            const id = resetEmail.trim();
            if (!id) { setBanner({ type: 'warn', title: '⚠️ Required', desc: 'Enter your email or phone number.' }); return; }
            if (isPhone(id)) {
                const cleanPhone = id.replace(/\D/g, '');
                const res = await forgotPasswordPhone(cleanPhone);
                if (res.devLink) {
                    console.log(`[Dev Mode] Password Reset Link:`, res.devLink);
                    setBanner({ 
                        type: 'success', 
                        title: '✅ Reset Link Sent via SMS!', 
                        desc: `Password reset link sent to +91 ${cleanPhone}. (Dev Mode: Link logged to console)`
                    });
                } else {
                    setBanner({ 
                        type: 'success', 
                        title: '✅ Reset Link Sent via SMS!', 
                        desc: `A password reset link has been sent to +91 ${cleanPhone}. Link expires in 1 hour.` 
                    });
                }
                setResetEmail('');
            } else if (isEmail(id)) {
                await resetPassword(id);
                setBanner({ type: 'success', title: '✅ Reset Link Sent!', desc: `Check ${id} inbox and spam folder. Link expires in 1 hour.` });
                setResetEmail('');
            } else {
                setBanner({ type: 'warn', title: '✉️ Invalid', desc: 'Enter a valid email or 10-digit phone number.' });
            }
        } catch (err) {
            console.error('Forgot error:', err);
            if (err?.code === 'auth/user-not-found') setBanner({ type: 'warn', title: '👤 Not Registered', desc: 'No account found. Please check your details.' });
            else setBanner(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // ── OTP → Reset identity verified → show new password ────────────
    const handleOTPReset = async (e) => {
        e.preventDefault();
        if (otp.replace(/\s/g, '').length < 6) { setBanner({ type: 'warn', title: '⚠️ Incomplete OTP', desc: 'Enter all 6 digits.' }); return; }
        setBanner(null);
        setLoading(true);
        try {
            const result = await confirmationResult.confirm(otp.replace(/\s/g, ''));
            const token = await result.user.getIdToken(true);
            setTempPhoneToken(token);
            setOtp('');
            setMode('new-password');
            setBanner({ type: 'success', title: '✅ Identity Verified!', desc: 'Now set your new password below.' });
        } catch (err) {
            setBanner(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // ── Update Password ───────────────────────────────────────────────
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) { setBanner({ type: 'warn', title: '🔑 Passwords Don\'t Match', desc: 'Both fields must be identical.' }); return; }
        if (newPassword.length < 6) { setBanner({ type: 'warn', title: '⚠️ Weak Password', desc: 'Must be at least 6 characters.' }); return; }
        setBanner(null);
        setLoading(true);
        try {
            if (tempPhoneToken) {
                await resetPasswordPhone(tempPhoneToken, pendingPhone, newPassword);
                setTempPhoneToken('');
            } else {
                await updatePassword(auth.currentUser, newPassword);
            }
            await signOut(auth);
            setMode('login');
            setNewPassword('');
            setConfirmNewPassword('');
            setBanner({ type: 'success', title: '🎉 Password Updated!', desc: 'Sign in now with your new password.' });
        } catch (err) {
            setBanner(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };


    const handleResendOTP = async () => {
        if (otpCountdown > 0) return;
        setBanner(null);
        setOtp('');
        try {
            await sendOTP(pendingPhone);
            setBanner({ type: 'success', title: '📱 OTP Resent', desc: `New OTP sent to +91 ${pendingPhone}` });
        } catch (err) { setBanner(getFriendlyError(err)); }
    };

    const handleGoogle = async () => {
        setBanner(null);
        try {
            await signInWithGoogle();
            localStorage.removeItem('local_crop_scans');
            navigate(location.state?.redirectUrl || '/dashboard');
        } catch (err) { setBanner(getFriendlyError(err)); }
    };

    const Btn = ({ children, onClick, disabled, color = 'emerald', type = 'submit' }) => {
        const colors = {
            emerald: 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 shadow-emerald-100',
            amber: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
            slate: 'bg-slate-800 hover:bg-slate-900 shadow-slate-100',
        };
        return (
            <button type={type} onClick={onClick} disabled={disabled || loading}
                className={`w-full ${colors[color]} disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]`}>
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : children}
            </button>
        );
    };


    const OTPActions = ({ onBack, backLabel = 'Back' }) => (
        <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
            <button type="button" onClick={onBack} className="flex items-center gap-1 hover:text-slate-600">
                <ArrowLeft size={11} /> {backLabel}
            </button>
            <button type="button" onClick={handleResendOTP} disabled={otpCountdown > 0}
                className={`flex items-center gap-1 ${otpCountdown > 0 ? 'opacity-40 cursor-not-allowed' : 'hover:text-emerald-600'}`}>
                <RefreshCw size={11} /> {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
            </button>
        </div>
    );

    // ── OTP VERIFY REGISTER ───────────────────────────────────────────
    if (mode === 'otp-register') return (
        <PageWrap mode={mode}>
            <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto"><Phone size={24} className="text-emerald-600" /></div>
                <h1 className="text-2xl font-black text-slate-900">Verify Phone</h1>
                <p className="text-xs text-slate-500 font-semibold">OTP sent to <span className="text-emerald-600 font-black">+91 {pendingPhone}</span></p>
            </div>
            <form onSubmit={handleOTPRegister} className="space-y-4">
                <OtpInput value={otp} onChange={setOtp} />
                {banner && <Banner msg={banner} onClose={clearBanner} />}
                <Btn color="emerald" disabled={otp.replace(/\s/g,'').length < 6}><Shield size={16} /> Verify & Create Account</Btn>
                <OTPActions onBack={() => { setMode('register'); setBanner(null); }} backLabel="Change Number" />
            </form>
        </PageWrap>
    );



    // ── OTP VERIFY RESET ──────────────────────────────────────────────
    if (mode === 'otp-reset') return (
        <PageWrap mode={mode}>
            <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto"><Shield size={24} className="text-amber-600" /></div>
                <h1 className="text-2xl font-black text-slate-900">Verify Identity</h1>
                <p className="text-xs text-slate-500 font-semibold">OTP sent to <span className="text-amber-600 font-black">+91 {pendingPhone}</span></p>
            </div>
            <form onSubmit={handleOTPReset} className="space-y-4">
                <OtpInput value={otp} onChange={setOtp} />
                {banner && <Banner msg={banner} onClose={clearBanner} />}
                <Btn color="amber" disabled={otp.replace(/\s/g,'').length < 6}><Shield size={16} /> Verify OTP</Btn>
                <OTPActions onBack={() => { setMode('forgot'); setBanner(null); }} />
            </form>
        </PageWrap>
    );

    // ── NEW PASSWORD ──────────────────────────────────────────────────
    if (mode === 'new-password') return (
        <PageWrap mode={mode}>
            <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto"><KeyRound size={24} className="text-emerald-600" /></div>
                <h1 className="text-2xl font-black text-slate-900">Set New Password</h1>
                <p className="text-xs text-slate-500 font-semibold">Identity verified ✅ Choose a strong password.</p>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-3">
                {[['New Password', newPassword, setNewPassword], ['Confirm Password', confirmNewPassword, setConfirmNewPassword]].map(([label, val, set], i) => (
                    <div key={i} className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input type={showNewPass ? 'text' : 'password'} required value={val} onChange={e => set(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-3 pl-10 pr-10 outline-none transition-all font-bold text-slate-900 text-sm" />
                            {i === 0 && <button type="button" onClick={() => setShowNewPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>}
                        </div>
                    </div>
                ))}
                {banner && <Banner msg={banner} onClose={clearBanner} />}
                <Btn color="emerald"><CheckCircle2 size={16} /> Update Password</Btn>
            </form>
        </PageWrap>
    );

    // ── FORGOT PASSWORD ───────────────────────────────────────────────
    if (mode === 'forgot') return (
        <PageWrap mode={mode}>
            <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto"><KeyRound size={24} className="text-amber-600" /></div>
                <h1 className="text-2xl font-black text-slate-900">Reset Password</h1>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Enter your <span className="text-blue-500 font-black">email</span> for a reset link,
                    or <span className="text-emerald-600 font-black">phone number</span> for an OTP.
                </p>
            </div>
            <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email or Phone</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input type="text" required autoFocus value={resetEmail}
                            onChange={e => { if (/^\d+$/.test(e.target.value) && e.target.value.length > 10) return; setResetEmail(e.target.value); }}
                            placeholder="email@example.com  or  9876543210"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-sm" />
                    </div>
                    <div className="flex gap-3 ml-1 mt-1">
                        <span className="text-[9px] font-black text-blue-500">📧 Email → reset link</span>
                        <span className="text-[9px] font-black text-emerald-500">📱 Phone → OTP</span>
                    </div>
                </div>
                {banner && <Banner msg={banner} onClose={clearBanner} />}
                <Btn color="amber"><ChevronRight size={16} /> Send Reset</Btn>
                <button type="button" onClick={() => { setMode('login'); setBanner(null); }}
                    className="w-full flex items-center justify-center gap-1 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft size={11} /> Back to Sign In
                </button>
            </form>
        </PageWrap>
    );

    // ── MAIN LOGIN / REGISTER ─────────────────────────────────────────
    const isLogin = mode === 'login';
    return (
        <PageWrap mode={mode}>
            {/* Header */}
            <div className="text-center space-y-1">
                <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
                    {isLogin ? <LogIn size={18} className="text-emerald-600" /> : <UserPlus size={18} className="text-emerald-600" />}
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                    {isLogin ? 'Welcome Back 👋' : 'Create Account 🌱'}
                </h2>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100/80 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50 shadow-inner">
                <button type="button" onClick={() => { setMode('login'); setBanner(null); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                        isLogin
                            ? 'bg-white text-emerald-700 shadow-sm scale-[1.02]'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    Sign In
                </button>
                <button type="button" onClick={() => { setMode('register'); setBanner(null); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                        !isLogin
                            ? 'bg-white text-emerald-700 shadow-sm scale-[1.02]'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    Register
                </button>
            </div>

            {/* Google */}
            <button type="button" onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all font-bold text-slate-700 shadow-sm text-sm active:scale-[0.98]">
                <Chrome size={18} className="text-emerald-600" /> Continue with Google
            </button>

            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200/50" />
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">or</span>
                <div className="h-px flex-1 bg-slate-200/50" />
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className={isLogin ? "space-y-2" : "space-y-1.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-3 md:gap-y-1"}>

                {!isLogin && (
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                placeholder="Your full name"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-2 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-sm" />
                        </div>
                    </div>
                )}

                <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email / Phone</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input type="text" required value={email}
                            onChange={e => { if (/^\d+$/.test(e.target.value) && e.target.value.length > 10) return; setEmail(e.target.value); }}
                            placeholder="email@example.com  or  9876543210"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-2 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-sm" />
                    </div>
                </div>

                <div className="space-y-0.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-2 pl-10 pr-10 outline-none transition-all font-bold text-slate-900 text-sm" />
                        <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                </div>

                {!isLogin && (
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-2 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-sm" />
                        </div>
                    </div>
                )}

                {isLogin && (
                    <div className="flex items-center justify-between px-1 pt-0.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remember Me</span>
                        </label>
                        <button type="button"
                            onClick={() => { setMode('forgot'); setResetEmail(email); setBanner(null); }}
                            className="text-[9px] font-black text-emerald-600 hover:text-emerald-800 transition-colors uppercase tracking-widest">
                            Forgot Password?
                        </button>
                    </div>
                )}

                {banner && (
                    <div className={!isLogin ? "md:col-span-2" : ""}>
                        <Banner msg={banner} onClose={clearBanner} />
                    </div>
                )}

                <div className={!isLogin ? "md:col-span-2" : ""}>
                    <Btn color="emerald">
                        <><ChevronRight size={16} /> {isLogin ? 'Sign In' : 'Create Account'}</>
                    </Btn>
                </div>
            </form>
        </PageWrap>
    );
};

export default Login;
