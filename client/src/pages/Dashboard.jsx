import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Calendar, TrendingUp, AlertCircle, CheckCircle2, ArrowUpRight, CloudSun, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';
import { getHistory, getWeather, getOutbreaks } from '../services/api';
import { Link } from 'react-router-dom';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Dashboard = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [greeting, setGreeting] = useState('');
    const [history, setHistory] = useState([]);
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalScans: 0,
        healthyCount: 0,
        diseasedCount: 0,
        healthPercentage: 0
    });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);


    const [outbreaks, setOutbreaks] = useState([]);

    useEffect(() => {
        const fetchOutbreakData = async () => {
            try {
                const data = await getOutbreaks();
                setOutbreaks(data);
            } catch (e) {
                console.error("Failed to fetch outbreak data");
            }
        };
        fetchOutbreakData();
    }, []);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting(t('goodMorning'));
        else if (hour < 18) setGreeting(t('goodAfternoon'));
        else setGreeting(t('goodEvening'));

        const getSafeTime = (ts) => {
            if (!ts) return 0;
            if (ts.seconds) return ts.seconds * 1000;
            if (ts._seconds) return ts._seconds * 1000;
            const d = new Date(ts);
            return isNaN(d.getTime()) ? 0 : d.getTime();
        };

        const processHistory = (local, cloud = []) => {
            const combined = [...local, ...cloud].sort((a, b) => {
                return getSafeTime(b.timestamp) - getSafeTime(a.timestamp);
            });

            const totalScans = combined.length;
            const healthyCount = combined.filter(h => h.disease === 'Healthy' || h.severity === 'None').length;
            const diseasedCount = totalScans - healthyCount;
            const healthPercentage = totalScans > 0 ? Math.round((healthyCount / totalScans) * 100) : 0;

            setHistory(combined.slice(0, 5));
            setStats({ totalScans, healthyCount, diseasedCount, healthPercentage });
        };

        // 1. Instant Load Local
        let localData = [];
        try {
            const storageKey = user ? `local_crop_scans_${user.uid}` : 'local_crop_scans';
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                localData = Array.isArray(parsed) ? parsed : [];
            }
        } catch (e) { console.error("Local Load Error", e); }

        try {
            const weatherKey = user ? `cached_weather_${user.uid}` : 'cached_weather';
            const cachedWeather = localStorage.getItem(weatherKey);
            if (cachedWeather) {
                const w = JSON.parse(cachedWeather);
                // Skip 'Guntur' cache to force a fresh lookup if location was inaccurate
                if (w.name !== 'Guntur') {
                    setWeather(w);
                }
            }
        } catch (e) {
            console.error("Local Load Error", e);
        }

        processHistory(localData);
        setLoading(false); // Stop blocking UI early

        // 2. Background Cloud Sync
        const syncData = async () => {
            // 1. Sync History Data
            try {
                const cloudData = await getHistory();
                processHistory(localData, Array.isArray(cloudData) ? cloudData : []);
            } catch (err) {
                console.log("History sync failed, using local only", err);
            }

            // 2. Sync Weather Data
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        try {
                            const w = await getWeather(pos.coords.latitude, pos.coords.longitude, Date.now());
                            setWeather(w);
                            const weatherKey = user ? `cached_weather_${user.uid}` : 'cached_weather';
                            localStorage.setItem(weatherKey, JSON.stringify(w));
                        } catch (e) {
                            console.log("Weather fetch error:", e);
                        }
                    },
                    async () => {
                        // Use IP-based detection if geolocation fails
                        try {
                            const w = await getWeather(undefined, undefined, Date.now());
                            setWeather(w);
                            const weatherKey = user ? `cached_weather_${user.uid}` : 'cached_weather';
                            localStorage.setItem(weatherKey, JSON.stringify(w));
                        } catch (e) {
                            console.log("IP-based weather fallback error:", e);
                        }
                    },
                    { timeout: 10000 }
                );
            } else {
                // Geo not supported - try IP via server
                try {
                    const w = await getWeather(undefined, undefined, Date.now());
                    setWeather(w);
                } catch (e) { console.log("Final weather fallback error:", e); }
            }
        };

        syncData();
    }, [t, user]);

    // Dynamic chart data based on history
    const chartData = {
        labels: history.length > 0
            ? history.slice(0, 7).map((_, i) => `Scan ${i + 1}`).reverse()
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Confidence Score',
                data: history.length > 0
                    ? history.slice(0, 7).map(h => Math.round((h.confidence || 0.85) * 100)).reverse()
                    : [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { min: 0, max: 100 },
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 w-full text-center md:text-left">
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">{greeting}, {user?.displayName || user?.email?.split('@')[0] || 'Farmer'}! 🌾</h1>
                    <p className="text-slate-500 font-medium mt-1 text-xs sm:text-base opacity-80">{t('dashboardSubtitle')}</p>
                </motion.div>
                <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 font-bold text-primary text-xs sm:text-sm w-full md:w-auto justify-center md:justify-start">
                    <Calendar size={18} />
                    <span>{currentTime.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="text-slate-300">|</span>
                    <span>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </header>

            {/* Quick Insights - Real Data */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        label: t('overallHealth'),
                        value: stats.totalScans > 0 ? `${stats.healthPercentage}%` : 'No Data',
                        sub: stats.totalScans > 0 ? `${stats.healthyCount} healthy scans` : 'Start scanning',
                        icon: <TrendingUp />,
                        color: 'text-green-600',
                        bg: 'bg-green-50'
                    },
                    {
                        label: t('activeAlerts'),
                        value: stats.diseasedCount.toString(),
                        sub: stats.diseasedCount > 0 ? 'Diseases detected' : 'All clear!',
                        icon: <AlertCircle />,
                        color: stats.diseasedCount > 0 ? 'text-red-600' : 'text-green-600',
                        bg: stats.diseasedCount > 0 ? 'bg-red-50' : 'bg-green-50'
                    },
                    {
                        label: t('tasksCompleted'),
                        value: `${stats.totalScans}`,
                        sub: 'Total scans',
                        icon: <CheckCircle2 />,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50'
                    },
                ].map((stat, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} className="card-base p-6 sm:p-8 space-y-3 sm:space-y-4">
                        <div className={`${stat.bg} ${stat.color} w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center`}>
                            {React.cloneElement(stat.icon, { size: 20 })}
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h2 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h2>
                            <p className={`text-sm font-bold mt-2 ${stat.color}`}>{stat.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </section>

            {/* Disease Alerts Section (New Plantix Feature) */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 translate-x-1/4 translate-y-1/4">
                    <AlertCircle size={200} />
                </div>
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h3 className="font-black text-2xl text-slate-900">{t('alerts')}</h3>
                        <p className="text-slate-400 text-sm font-bold mt-1">Disease activity monitoring in your region</p>
                    </div>
                    <span className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest animate-pulse">
                        Live Tracking
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {outbreaks.map((alert, i) => (
                        <div key={i} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative group hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div className={`absolute top-4 right-4 ${alert.color} text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest`}>
                                {alert.status}
                            </div>
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                                {alert.crop.includes('Wheat') ? '🌾' : alert.crop.includes('Tomato') ? '🍅' : alert.crop.includes('Maize') ? '🌽' : alert.crop.includes('Cotton') ? '☁️' : '🌱'}
                            </div>
                            <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">{alert.crop}</h4>
                            <h5 className="font-black text-slate-800 text-base mt-1 leading-tight">{alert.disease}</h5>

                            <Link to="/detect" className="mt-6 flex items-center justify-between text-[10px] font-black uppercase text-primary tracking-widest group-hover:gap-4 transition-all">
                                <span>Preventive Measures</span>
                                <ArrowUpRight size={14} />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Weather & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-2xl text-slate-900">{t('performanceIndex')}</h3>
                        {stats.totalScans === 0 && (
                            <Link to="/detect" className="text-primary text-sm font-bold hover:underline">
                                Start Scanning →
                            </Link>
                        )}
                    </div>
                    <div className="h-[300px]">
                        {stats.totalScans > 0 ? (
                            <Line data={chartData} options={options} />
                        ) : (
                            <div className="h-full flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="text-center">
                                    <p className="text-slate-400 font-bold">No scan data yet</p>
                                    <Link to="/detect" className="text-primary font-bold text-sm mt-2 inline-block hover:underline">
                                        Scan your first crop →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-primary text-white p-10 rounded-[3rem] shadow-2xl shadow-primary/20 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><CloudSun size={150} /></div>
                    <div className="relative z-10 space-y-2">
                        <p className="font-bold text-slate-100/60 uppercase tracking-widest">{t('localWeather')}</p>
                        <h3 className="text-6xl font-black">
                            {weather?.main?.temp ? Math.round(weather.main.temp) : '--'}°C
                        </h3>
                        <p className="text-xl font-medium opacity-90">
                            {weather?.weather?.[0]?.main || 'Loading...'}
                        </p>
                        <p className="text-sm opacity-70">
                            {weather?.name || 'Your Location'}
                        </p>
                    </div>
                    <Link to="/weather" className="relative z-10 w-full bg-white text-primary py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-xl">
                        {t('detailedForecast')} <ArrowUpRight size={20} />
                    </Link>
                </div>
            </div>

            {/* Recent History */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="font-black text-2xl text-slate-900">{t('detectionHistory')}</h3>
                    <Link to="/history" className="text-primary font-bold text-sm hover:underline">
                        View All →
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.length > 0 ? (
                        history.slice(0, 3).map((p, i) => (
                            <div key={i} className="group p-6 rounded-3xl border border-slate-50 hover:border-primary/20 hover:bg-slate-50 transition-all cursor-pointer">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl ${p.disease === 'Healthy' || p.severity === 'None' ? 'bg-green-50' : 'bg-red-50'}`}>
                                    {p.disease === 'Healthy' || p.severity === 'None' ? '🌿' : '🍂'}
                                </div>
                                <h4 className="font-black text-xl text-slate-900">{t(p.disease) || p.disease}</h4>
                                <p className="text-sm font-bold text-slate-400 mt-2">
                                    {(() => {
                                        const t = p.timestamp;
                                        if (!t) return 'Just now';
                                        if (t.seconds) return new Date(t.seconds * 1000).toLocaleDateString();
                                        if (t._seconds) return new Date(t._seconds * 1000).toLocaleDateString();
                                        const d = new Date(t);
                                        return !isNaN(d.getTime()) ? d.toLocaleDateString() : 'Just now';
                                    })()}
                                </p>
                                <p className="text-xs font-bold text-primary mt-1">
                                    {(p.confidence * 100).toFixed(1)}% confidence
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No detection history yet</p>
                            <Link to="/detect" className="text-primary font-bold text-sm mt-2 inline-block hover:underline">
                                Start your first scan →
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
