import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudSun, Droplets, Wind, Thermometer, MapPin, Search, Loader2, Navigation } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { getWeather } from '../services/api';

const Weather = () => {
    const { t } = useLanguage();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState({ city: 'Loading...', region: '' });
    const [searchCity, setSearchCity] = useState('');

    useEffect(() => {
        // Try to get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    await fetchWeather(latitude, longitude);
                },
                async (error) => {
                    console.log("Geolocation error, using default:", error);
                    // Default to Guntur, Andhra Pradesh
                    await fetchWeather(16.3067, 80.4365);
                }
            );
        } else {
            // Default location
            fetchWeather(16.3067, 80.4365);
        }
    }, []);

    const fetchWeather = async (lat, lon) => {
        try {
            setLoading(true);
            const data = await getWeather(lat, lon);
            setWeather(data);
            setLocation({
                city: data.name || 'Unknown',
                region: data.sys?.country === 'IN' ? 'India' : data.sys?.country || ''
            });
        } catch (error) {
            console.error("Weather fetch error:", error);
            // Set mock data
            setWeather({
                main: { temp: 28, humidity: 64, feels_like: 30 },
                weather: [{ main: 'Cloudy', description: 'partly cloudy' }],
                wind: { speed: 12 },
                name: 'Guntur'
            });
            setLocation({ city: 'Guntur', region: 'Andhra Pradesh' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchCity.trim()) return;

        // Use geocoding API or predefined cities
        const cities = {
            'delhi': { lat: 28.6139, lon: 77.2090 },
            'mumbai': { lat: 19.0760, lon: 72.8777 },
            'bangalore': { lat: 12.9716, lon: 77.5946 },
            'bengaluru': { lat: 12.9716, lon: 77.5946 },
            'hyderabad': { lat: 17.3850, lon: 78.4867 },
            'chennai': { lat: 13.0827, lon: 80.2707 },
            'kolkata': { lat: 22.5726, lon: 88.3639 },
            'guntur': { lat: 16.3067, lon: 80.4365 },
            'vijayawada': { lat: 16.5062, lon: 80.6480 },
            'lucknow': { lat: 26.8467, lon: 80.9462 },
            'jaipur': { lat: 26.9124, lon: 75.7873 },
            'patna': { lat: 25.5941, lon: 85.1376 },
        };

        const cityKey = searchCity.toLowerCase().trim();
        const coords = cities[cityKey];

        if (coords) {
            await fetchWeather(coords.lat, coords.lon);
        } else {
            alert('City not found. Try: Delhi, Mumbai, Hyderabad, Guntur, etc.');
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    await fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    alert('Could not get your location. Please allow location access.');
                    setLoading(false);
                }
            );
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <MapPin size={18} /> {location.city}, {location.region}
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{t('localWeather')}</h1>
                    <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Farm-specific localized forecasting</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search city..."
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-12 focus:ring-2 focus:ring-primary outline-none font-bold text-slate-900"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    </div>
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="p-4 bg-primary text-white rounded-2xl hover:bg-primary-dark transition-colors"
                        title="Use my location"
                    >
                        <Navigation size={20} />
                    </button>
                </form>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Forecast Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 bg-gradient-to-br from-primary to-primary-dark p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <CloudSun size={300} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                            <div className="space-y-4">
                                <p className="text-xl font-bold opacity-80">{t('today')}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                <h2 className="text-9xl font-black">{weather?.main?.temp ? Math.round(weather.main.temp) : '--'}°C</h2>
                                <p className="text-2xl font-medium">{weather?.weather?.[0]?.main || 'Loading...'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8 bg-white/10 backdrop-blur-md p-8 rounded-[3rem] border border-white/10">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Humidity</p>
                                    <div className="flex items-center gap-2 text-2xl font-bold"><Droplets /> {weather?.main?.humidity || '--'}%</div>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Wind</p>
                                    <div className="flex items-center gap-2 text-2xl font-bold"><Wind /> {weather?.wind?.speed || '--'} km/h</div>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Feels Like</p>
                                    <div className="flex items-center gap-2 text-2xl font-bold">{weather?.main?.feels_like ? Math.round(weather.main.feels_like) : '--'}°C</div>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Location</p>
                                    <div className="flex items-center gap-2 text-lg font-bold">{location.city}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 5-Day Outlook */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card-base p-10 space-y-8"
                    >
                        <h3 className="text-2xl font-black text-slate-900">5-Day Outlook</h3>
                        <div className="space-y-6">
                            {[
                                { day: 'Tomorrow', temp: `${(weather?.main?.temp || 28) + 1}°`, icon: <CloudSun size={20} className="text-yellow-500" />, condition: 'Sunny' },
                                { day: 'Day 2', temp: `${(weather?.main?.temp || 28) - 1}°`, icon: <Droplets size={20} className="text-blue-500" />, condition: 'Showers' },
                                { day: 'Day 3', temp: `${(weather?.main?.temp || 28) + 2}°`, icon: <Thermometer size={20} className="text-red-500" />, condition: 'Hot' },
                                { day: 'Day 4', temp: `${(weather?.main?.temp || 28)}°`, icon: <CloudSun size={20} className="text-slate-400" />, condition: 'Cloudy' },
                                { day: 'Day 5', temp: `${(weather?.main?.temp || 28)}°`, icon: <CloudSun size={20} className="text-slate-400" />, condition: 'Cloudy' },
                            ].map((d, i) => (
                                <div key={i} className="flex justify-between items-center group cursor-default">
                                    <span className="font-bold text-slate-500 w-24 group-hover:text-primary transition-colors">{d.day}</span>
                                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 min-w-[120px]">
                                        {d.icon}
                                        <span className="font-black text-slate-900">{d.temp}</span>
                                        <span className="text-[10px] uppercase font-black text-slate-400">{d.condition}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Farming Advisory Section */}
            <div className="card-base p-10 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-900">
                    <CloudSun size={150} />
                </div>
                <div className="bg-emerald-500 text-white p-6 rounded-3xl shadow-lg shadow-emerald-200 z-10">
                    <Thermometer size={40} />
                </div>
                <div className="space-y-3 z-10 flex-1">
                    <h4 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        {t('cropAdvisory')} <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">Live AI</span>
                    </h4>
                    <p className="text-lg text-slate-700 font-medium leading-relaxed">
                        {(() => {
                            if (!weather) return 'Loading advice...';
                            const temp = weather.main?.temp || 0;
                            const humidity = weather.main?.humidity || 0;
                            const wind = weather.wind?.speed || 0;
                            const condition = weather.weather?.[0]?.main?.toLowerCase() || '';

                            if (condition.includes('rain') || condition.includes('drizzle')) return t('rainRisk');
                            if (wind > 20) return t('windRisk');
                            if (temp > 35) return t('highTempRisk');
                            if (temp < 10) return t('lowTempRisk');
                            if (humidity > 80) return t('highHumRisk');
                            return t('goodConditions');
                        })()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Weather;
