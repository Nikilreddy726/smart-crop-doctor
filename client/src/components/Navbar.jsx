import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showLanguage, setShowLanguage] = useState(false);
    const location = useLocation();
    const { setLang, t, lang } = useLanguage();
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: t('detect'), path: '/detect', icon: '📸' },
        { name: t('dashboard'), path: '/dashboard', icon: '📊' },
        { name: t('fertilizerCalc'), path: '/fertilizer', icon: '⚖️' },
        { name: t('financialTracker'), path: '/profit', icon: '📈' },
        { name: t('agriShops'), path: '/shops', icon: '🏢' },
        { name: t('history'), path: '/history', icon: '📜' },
        { name: t('weather'), path: '/weather', icon: '🌤️' },
        { name: t('mandi'), path: '/mandi', icon: '💰' },
        { name: t('schemes'), path: '/schemes', icon: '🏛️' },
        { name: t('community'), path: '/community', icon: '👩‍🌾' },
    ];

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिंदी' },
        { code: 'te', name: 'తెలుగు' },
        { code: 'kn', name: 'ಕನ್ನಡ' },
        { code: 'ta', name: 'தமிழ்' },
        { code: 'ml', name: 'മലയാളം' }
    ];

    const isLoginPage = location.pathname === '/login';

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg py-2' : 'bg-transparent py-4'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo with Animation */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <motion.div
                            className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-200"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <Leaf className="text-white w-6 h-6" />
                        </motion.div>
                        <motion.span
                            className="text-xl font-black bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                        >
                            SMART CROP DOCTOR
                        </motion.span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className={`${isLoginPage ? 'flex' : 'hidden lg:flex'} items-center space-x-1`}>
                        {!isLoginPage && navLinks.map((link) => (
                            <Link key={link.path} to={link.path}>
                                <motion.div
                                    className={`relative flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 group ${location.pathname === link.path
                                        ? 'text-green-600 bg-green-50'
                                        : 'text-slate-600 hover:text-green-600 hover:bg-green-50/50'
                                        }`}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="text-xl mb-0.5 group-hover:scale-125 transition-transform duration-200">
                                        {link.icon}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-wider">
                                        {link.name}
                                    </span>
                                    {location.pathname === link.path && (
                                        <motion.div
                                            layoutId="nav-underline"
                                            className="absolute bottom-0 left-2 right-2 h-0.5 bg-green-500 rounded-full"
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        ))}

                        {/* Language Selector */}
                        <div className={`relative ${!isLoginPage && 'ml-4 pl-4 border-l border-slate-200'}`}>
                            <button
                                onClick={() => setShowLanguage(!showLanguage)}
                                className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-500 hover:text-green-600"
                            >
                                <Globe size={18} />
                                <span className="text-[10px] font-black uppercase">{lang}</span>
                            </button>

                            <AnimatePresence>
                                {showLanguage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 grid grid-cols-2 gap-1 w-[220px]"
                                    >
                                        {languages.map(l => (
                                            <button
                                                key={l.code}
                                                onClick={() => { setLang(l.code); setShowLanguage(false); }}
                                                className={`px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all ${lang === l.code
                                                    ? 'bg-green-50 text-green-600'
                                                    : 'hover:bg-slate-50 text-slate-500'
                                                    }`}
                                            >
                                                {l.name}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {!isLoginPage && (user ? (
                            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Farmer</span>
                                    <span className="text-[11px] font-bold text-slate-900">{user.displayName || user.email.split('@')[0]}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-red-600 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200"
                                >
                                    {t('logout')}
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="ml-4 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-green-600 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200"
                            >
                                {t('login')}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Toggle */}
                    {!isLoginPage && (
                        <button
                            className="lg:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-xl"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
                    >
                        <div className="p-4 flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${location.pathname === link.path
                                        ? 'bg-green-50 text-green-600'
                                        : 'hover:bg-slate-50 text-slate-500'
                                        }`}
                                >
                                    <span className="text-2xl">{link.icon}</span>
                                    <span className="text-xs font-black uppercase tracking-widest">{link.name}</span>
                                </Link>
                            ))}
                            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-50">
                                {languages.map(l => (
                                    <button
                                        key={l.code}
                                        onClick={() => { setLang(l.code); setIsOpen(false); }}
                                        className={`py-2 rounded-xl text-[10px] font-black uppercase ${lang === l.code ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'
                                            }`}
                                    >
                                        {l.code}
                                    </button>
                                ))}
                            </div>
                            {user ? (
                                <button
                                    onClick={() => { logout(); setIsOpen(false); }}
                                    className="mt-4 bg-red-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center"
                                >
                                    {t('logout')}
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="mt-4 bg-slate-900 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center"
                                >
                                    {t('login')}
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
