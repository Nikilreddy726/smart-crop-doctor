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
    updatePassword, signOut, updateProfile,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { loginUser, registerUser, signInWithGoogle, resetPassword } from '../services/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';

// ─── Friendly Firebase error messages ─────────────────────────────────────────
const getFriendlyError = (error) => {
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
    return { type: 'error', title: '❌ Something Went Wrong', desc: 'An unexpected error occurred. Please try again.' };
};

// ─── Error / Success Banner ────────────────────────────────────────────────────
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
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 border rounded-xl ${base}`}
        >
            <div className="flex items-start gap-2">
                <Icon size={15} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-[11px] font-black">{msg.title}</p>
                    {msg.desc && <p className="text-[10px] font-semibold mt-0.5 leading-relaxed opacity-80">{msg.desc}</p>}
                </div>
                {onClose && <button onClick={onClose} className="opacity-50 hover:opacity-100"><XCircle size={13} /></button>}
            </div>
        </motion.div>
    );
};

// ─── 6-box OTP Input ───────────────────────────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
    const inputs = useRef([]);
    const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

    const handleKey = (e, i) => {
        if (e.key === 'Backspace') {
            const next = [...digits];
            if (next[i]) { next[i] = ''; onChange(next.join('')); }
            else if (i > 0) { inputs.current[i - 1]?.focus(); }
        }
    };

    const handleChange = (e, i) => {
        const val = e.target.value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = val;
        onChange(next.join(''));
        if (val && i < 5) inputs.current[i + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted.padEnd(6, '').slice(0, 6));
        inputs.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center">
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={el => inputs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleChange(e, i)}
                    onKeyDown={e => handleKey(e, i)}
                    onPaste={handlePaste}
                    className={`w-10 h-12 text-center text-lg font-black rounded-xl border-2 outline-none transition-all
                        ${d ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-800'}
                        focus:border-emerald-400 focus:bg-white`}
                />
            ))}
        </div>
    );
};


// ─── Main Login Component ──────────────────────────────────────────────────────
const Login = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const dest = location.state?.redirectUrl || '/dashboard';
            navigate(dest, { replace: true });
        }
    }, [user, navigate, location]);

    // ── Form State ──────────────────────────────────────────────────
    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'otp-register' | 'otp-reset' | 'new-password'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(false);

    // ── OTP state ───────────────────────────────────────────────────
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [pendingPhone, setPendingPhone] = useState(''); // 10-digit phone
    const [pendingCreds, setPendingCreds] = useState(null); // {shadowEmail, password, name} for registration
    const [otpCountdown, setOtpCountdown] = useState(0);
    const recaptchaContainerRef = useRef(null);

    // Countdown timer for resend OTP
    useEffect(() => {
        if (otpCountdown <= 0) return;
        const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [otpCountdown]);

    const clearBanner = () => setBanner(null);

    // ── Helpers ─────────────────────────────────────────────────────
    const isPhone = (val) => /^\d{10}$/.test(val.trim());
    const isEmailFormat = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    const toShadowEmail = (phone) => `${phone}@farmer.com`;

    const setupRecaptcha = () => {
        // Clear existing verifier
        if (window._rcVerifier) {
            try { window._rcVerifier.clear(); } catch (_) {}
        }
        window._rcVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
            'expired-callback': () => {
                setBanner({ type: 'warn', title: '⏳ reCAPTCHA Expired', desc: 'Please try sending OTP again.' });
            }
        });
        return window._rcVerifier;
    };

    const sendOTP = async (phone) => {
        const verifier = setupRecaptcha();
        const phoneNumber = `+91${phone}`;
        const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        setConfirmationResult(result);
        setOtpCountdown(60);
        setPendingPhone(phone);
    };

    // ── Main Login Handler ───────────────────────────────────────────
    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setBanner(null);
        try {
            let identifier = email.trim();
            const phoneMode = isPhone(identifier);
            const emailMode = isEmailFormat(identifier);

            if (!phoneMode && !emailMode) {
                setBanner({ type: 'warn', title: '✉️ Invalid Format', desc: 'Enter a valid email address or 10-digit mobile number.' });
                return;
            }

            const shadowEmail = phoneMode ? toShadowEmail(identifier) : identifier;

            if (mode === 'login') {
                await loginUser(shadowEmail, password);
                localStorage.removeItem('local_crop_scans');
                navigate(location.state?.redirectUrl || '/dashboard');

            } else {
                // Registration
                if (password !== confirmPassword) {
                    setBanner({ type: 'warn', title: '🔑 Passwords Don\'t Match', desc: 'Both password fields must be identical.' });
                    return;
                }
                if (password.length < 6) {
                    setBanner({ type: 'warn', title: '⚠️ Weak Password', desc: 'Password must be at least 6 characters.' });
                    return;
                }

                if (phoneMode) {
                    // Phone registration: verify with OTP first
                    setPendingCreds({ shadowEmail, password, name });
                    await sendOTP(identifier);
                    setMode('otp-register');
                } else {
                    // Email registration: straight signup
                    await registerUser(shadowEmail, password, name);
                    localStorage.removeItem('local_crop_scans');
                    navigate(location.state?.redirectUrl || '/dashboard');
                }
            }
        } catch (err) {
            console.error('Auth error:', err);
            setBanner(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // ── OTP Verify for Registration ──────────────────────────────────
    const handleVerifyOTPRegister = async (e) => {
        e.preventDefault();
        if (otp.length < 6) { setBanner({ type: 'warn', title: '⚠️ Incomplete OTP', desc: 'Please enter all 6 digits.' }); return; }
        setLoading(true);
        setBanner(null);
        try {
            // Confirm OTP → signs in as phone auth user
            const result = await confirmationResult.confirm(otp);
            const phoneUser = result.user;

            // Link shadow email+password to this phone auth user
            const { shadowEmail, password, name } = pendingCreds;
            try {
                const emailCredential = EmailAuthProvider.credential(shadowEmail, password);
                await linkWithCredential(phoneUser, emailCredential);
            } catch (linkErr) {
                if (linkErr.code === 'auth/email-already-in-use') {
                    // Account already exists — sign out phone auth and sign in with email
                    await signOut(auth);
                    await loginUser(shadowEmail, password);
                    navigate(location.state?.redirectUrl || '/dashboard');
                    return;
                }
                throw linkErr;
            }

            // Update display name
            if (name) await updateProfile(phoneUser, { displayName: name });

            // Sign out phone auth session, sign back in with email/password (sets session correctly)
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

    // ── Forgot Password: send OTP or email link ──────────────────────
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setBanner(null);
        try {
            const identifier = resetEmail.trim();
            if (!identifier) { setBanner({ type: 'warn', title: '⚠️ Required', desc: 'Please enter your email or phone number.' }); return; }

            if (isPhone(identifier)) {
                // Phone account → send OTP
                await sendOTP(identifier);
                setMode('otp-reset');
            } else if (isEmailFormat(identifier)) {
                // Email account → send reset link
                await resetPassword(identifier);
                setBanner({ type: 'success', title: '✅ Reset Link Sent!', desc: `Check ${identifier} inbox (and spam folder). Link expires in 1 hour.` });
                setResetEmail('');
            } else {
                setBanner({ type: 'warn', title: '✉️ Invalid Format', desc: 'Enter a valid email or 10-digit mobile number.' });
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            const code = err?.code || '';
            if (code === 'auth/user-not-found') {
                setBanner({ type: 'warn', title: '👤 Not Registered', desc: 'No account found with these details. Please check or create a new account.' });
            } else {
                setBanner(getFriendlyError(err));
            }
        } finally {
            setLoading(false);
        }
    };

    // ── OTP Verify for Password Reset ────────────────────────────────
    const handleVerifyOTPReset = async (e) => {
        e.preventDefault();
        if (otp.length < 6) { setBanner({ type: 'warn', title: '⚠️ Incomplete OTP', desc: 'Enter all 6 OTP digits.' }); return; }
        setLoading(true);
        setBanner(null);
        try {
            await confirmationResult.confirm(otp);
            // Signed in as phone auth user (same UID as shadow email if registered with OTP)
            setOtp('');
            setMode('new-password');
            setBanner({ type: 'success', title: '✅ Identity Verified!', desc: 'Now set your new password below.' });
        } catch (err) {
            console.error('OTP reset verify error:', err);
            setBanner(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // ── Update Password after OTP ─────────────────────────────────────
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setBanner({ type: 'warn', title: '🔑 Passwords Don\'t Match', desc: 'Both fields must be identical.' });
            return;
        }
        if (newPassword.length < 6) {
            setBanner({ type: 'warn', title: '⚠️ Weak Password', desc: 'Password must be at least 6 characters.' });
            return;
        }
        setLoading(true);
        setBanner(null);
        try {
            await updatePassword(auth.currentUser, newPassword);
            // Sign out and redirect to login with success message
            await signOut(auth);
            setMode('login');
            setEmail('');
            setPassword('');
            setBanner({ type: 'success', title: '🎉 Password Reset Successful!', desc: 'Your password has been updated. Please sign in with your new password.' });
        } catch (err) {
            console.error('Update password error:', err);
            setBanner(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // ── Resend OTP ────────────────────────────────────────────────────
    const handleResendOTP = async () => {
        if (otpCountdown > 0) return;
        setBanner(null);
        setOtp('');
        try {
            await sendOTP(pendingPhone);
            setBanner({ type: 'success', title: '📱 OTP Resent', desc: `A new OTP has been sent to +91 ${pendingPhone}` });
        } catch (err) {
            setBanner(getFriendlyError(err));
        }
    };

    // ── Google Sign In ─────────────────────────────────────────────────
    const handleGoogle = async () => {
        setBanner(null);
        try {
            await signInWithGoogle();
            localStorage.removeItem('local_crop_scans');
            navigate(location.state?.redirectUrl || '/dashboard');
        } catch (err) {
            setBanner(getFriendlyError(err));
        }
    };

    // ══════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════

    const Card = ({ children }) => (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
            {/* Invisible reCAPTCHA container (required by Firebase) */}
            <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm"
            >
                <div className="bg-white rounded-3xl shadow-2xl p-7 space-y-5 border border-slate-100">
                    {children}
                </div>
            </motion.div>
        </div>
    );

    // ── OTP Register View ──────────────────────────────────────────────
    if (mode === 'otp-register') return (
        <Card>
            <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
                    <Phone size={24} />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Verify Phone</h1>
                <p className="text-xs text-slate-500 font-semibold">
                    Enter the 6-digit OTP sent to <span className="text-emerald-600 font-black">+91 {pendingPhone}</span>
                </p>
            </div>

            <form onSubmit={handleVerifyOTPRegister} className="space-y-4">
                <OtpInput value={otp} onChange={setOtp} />

                <AnimatePresence>
                    {banner && <Banner msg={banner} onClose={clearBanner} />}
                </AnimatePresence>

                <button type="submit" disabled={loading || otp.length < 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all">
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Shield size={16} /> Verify & Create Account</>}
                </button>

                <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
                    <button type="button" onClick={() => { setMode('register'); setBanner(null); }} className="flex items-center gap-1 hover:text-slate-600">
                        <ArrowLeft size={11} /> Change Number
                    </button>
                    <button type="button" onClick={handleResendOTP} disabled={otpCountdown > 0}
                        className={`flex items-center gap-1 ${otpCountdown > 0 ? 'opacity-40 cursor-not-allowed' : 'hover:text-emerald-600'}`}>
                        <RefreshCw size={11} /> {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
                    </button>
                </div>
            </form>
        </Card>
    );

    // ── OTP Reset View ─────────────────────────────────────────────────
    if (mode === 'otp-reset') return (
        <Card>
            <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
                    <Shield size={24} />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Verify Identity</h1>
                <p className="text-xs text-slate-500 font-semibold">
                    OTP sent to <span className="text-amber-600 font-black">+91 {pendingPhone}</span>. Enter it below to reset your password.
                </p>
            </div>

            <form onSubmit={handleVerifyOTPReset} className="space-y-4">
                <OtpInput value={otp} onChange={setOtp} />

                <AnimatePresence>
                    {banner && <Banner msg={banner} onClose={clearBanner} />}
                </AnimatePresence>

                <button type="submit" disabled={loading || otp.length < 6}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all">
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Shield size={16} /> Verify OTP</>}
                </button>

                <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
                    <button type="button" onClick={() => { setMode('forgot'); setBanner(null); }} className="flex items-center gap-1 hover:text-slate-600">
                        <ArrowLeft size={11} /> Back
                    </button>
                    <button type="button" onClick={handleResendOTP} disabled={otpCountdown > 0}
                        className={`flex items-center gap-1 ${otpCountdown > 0 ? 'opacity-40 cursor-not-allowed' : 'hover:text-amber-600'}`}>
                        <RefreshCw size={11} /> {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
                    </button>
                </div>
            </form>
        </Card>
    );

    // ── New Password View (after OTP reset) ────────────────────────────
    if (mode === 'new-password') return (
        <Card>
            <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
                    <KeyRound size={24} />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Set New Password</h1>
                <p className="text-xs text-slate-500 font-semibold">Identity verified ✅ Choose a strong new password.</p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
                {[
                    { label: 'New Password', val: newPassword, set: setNewPassword },
                    { label: 'Confirm Password', val: confirmNewPassword, set: setConfirmNewPassword },
                ].map(({ label, val, set }, i) => (
                    <div key={i} className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input type={showPass ? 'text' : 'password'} required value={val} onChange={e => set(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-3 pl-10 pr-10 outline-none transition-all font-bold text-slate-900 text-xs" />
                            {i === 0 && <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>}
                        </div>
                    </div>
                ))}

                <AnimatePresence>
                    {banner && <Banner msg={banner} onClose={clearBanner} />}
                </AnimatePresence>

                <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100">
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle2 size={16} /> Update Password</>}
                </button>
            </form>
        </Card>
    );

    // ── Forgot Password View ───────────────────────────────────────────
    if (mode === 'forgot') return (
        <Card>
            <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
                    <KeyRound size={24} />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Reset Password</h1>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Enter your <span className="text-amber-600 font-black">email</span> to get a reset link,
                    or your <span className="text-emerald-600 font-black">10-digit phone</span> to receive an OTP.
                </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email or Phone Number</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input type="text" required autoFocus value={resetEmail}
                            onChange={e => { if (/^\d+$/.test(e.target.value) && e.target.value.length > 10) return; setResetEmail(e.target.value); }}
                            placeholder="email@example.com or 9876543210"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-400 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-xs" />
                    </div>
                    <div className="flex gap-3 text-[9px] font-black ml-1 mt-1.5">
                        <span className="text-blue-500">📧 Email → reset link</span>
                        <span className="text-emerald-500">📱 Phone → OTP</span>
                    </div>
                </div>

                <AnimatePresence>
                    {banner && <Banner msg={banner} onClose={clearBanner} />}
                </AnimatePresence>

                <button type="submit" disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-100">
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ChevronRight size={16} /> Send Reset</>}
                </button>

                <button type="button" onClick={() => { setMode('login'); setBanner(null); }}
                    className="w-full flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft size={11} /> Back to Sign In
                </button>
            </form>
        </Card>
    );

    // ── Main Login / Register View ─────────────────────────────────────
    const isLogin = mode === 'login';
    return (
        <Card>
            {/* Logo */}
            <div className="text-center space-y-2">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
                    {isLogin ? <LogIn size={24} /> : <UserPlus size={24} />}
                </motion.div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {isLogin ? t('welcomeBack') || 'Welcome Back' : t('createAccount') || 'Create Account'}
                </h1>
                {!isLogin && (
                    <p className="text-[10px] text-slate-400 font-semibold">
                        📱 Phone users — OTP will verify your number at signup
                    </p>
                )}
            </div>

            {/* Google */}
            <button onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 hover:bg-slate-50 transition-all font-bold text-slate-700 shadow-sm text-xs">
                <Chrome size={18} className="text-emerald-600" />
                {t('googleLogin') || 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3 opacity-40">
                <div className="h-px grow bg-slate-200" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">or</span>
                <div className="h-px grow bg-slate-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-3">
                {!isLogin && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('fullName') || 'Full Name'}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                placeholder={t('yourName') || 'Your full name'}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-xs" />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('emailPhone') || 'Email / Phone'}</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input type="text" required value={email}
                            onChange={e => { if (/^\d+$/.test(e.target.value) && e.target.value.length > 10) return; setEmail(e.target.value); }}
                            placeholder={t('emailPhonePlaceholder') || 'email@example.com or 9876543210'}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-xs" />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password') || 'Password'}</label>
                        {isLogin && (
                            <button type="button"
                                onClick={() => { setMode('forgot'); setResetEmail(email); setBanner(null); }}
                                className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 transition-colors">
                                Forgot Password?
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-3 pl-10 pr-10 outline-none transition-all font-bold text-slate-900 text-xs" />
                        <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                </div>

                {!isLogin && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('confirmPasswordLabel') || 'Confirm Password'}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-400 focus:bg-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all font-bold text-slate-900 text-xs" />
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {banner && <Banner msg={banner} onClose={clearBanner} />}
                </AnimatePresence>

                <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 mt-2">
                    {loading
                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <>{isPhone(email) && !isLogin ? <><Phone size={15} /> Send OTP</> : <><ChevronRight size={16} /> {isLogin ? t('signIn') || 'Sign In' : t('joinNow') || 'Create Account'}</>}</>
                    }
                </button>
            </form>

            <div className="text-center">
                <button onClick={() => { setMode(isLogin ? 'register' : 'login'); setBanner(null); }}
                    className="text-[10px] font-black text-slate-400 hover:text-emerald-600 transition-colors tracking-tight uppercase">
                    {isLogin ? t('needAccount') || "Don't have an account? Register" : t('existingMember') || 'Already have an account? Sign In'}
                </button>
            </div>
        </Card>
    );
};

export default Login;
