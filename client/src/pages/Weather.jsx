import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudSun, Droplets, Wind, Thermometer, MapPin, Search, Loader2, Navigation, CheckCircle } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { getWeather } from '../services/api';

const Weather = () => {
    const { t } = useLanguage();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState({ city: 'Loading...', region: '' });
    const [searchCity, setSearchCity] = useState('');

    useEffect(() => {
        const CACHE_EXPIRY = 6 * 60 * 60 * 1000; // 6 Hours
        let isManual = false;

        // 1. Load from Cache
        try {
            const cachedW = localStorage.getItem('cached_weather');
            const cachedL = localStorage.getItem('cached_location');
            const cacheTime = localStorage.getItem('weather_cache_time');

            if (cachedW && cachedL) {
                const loc = JSON.parse(cachedL);
                const weatherData = JSON.parse(cachedW);
                const isStale = !cacheTime || (Date.now() - parseInt(cacheTime)) > CACHE_EXPIRY;

                setWeather(weatherData);
                setLocation(loc);
                setLoading(false);

                if (loc.isManual) isManual = true;

                // If data is fresh, don't trigger background refresh immediately
                if (!isStale) return;
            }
        } catch (e) { console.error("Cache load failed", e); }

        // 2. Background Refresh
        if (isManual) {
            const savedLoc = JSON.parse(localStorage.getItem('cached_location'));
            // If we have manual coords in the saved loc, use them for refresh
            fetchWeather(savedLoc.lat, savedLoc.lon, savedLoc);
            return;
        }

        const triggerAutoDetect = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        await fetchWeather(position.coords.latitude, position.coords.longitude);
                    },
                    async (error) => {
                        console.log("Geolocation error, using IP fallback:", error);
                        await fetchWeather();
                    },
                    { timeout: 8000, enableHighAccuracy: true }
                );
            } else {
                fetchWeather();
            }
        };

        triggerAutoDetect();
    }, []);

    const fetchWeather = async (lat, lon, locationOverride = null) => {
        try {
            setLoading(true);
            const data = await getWeather(lat, lon, Date.now());
            setWeather(data);

            let loc;
            if (locationOverride) {
                loc = { ...locationOverride, isManual: !!locationOverride.isManual, lat, lon };
            } else {
                const cityName = data.name && data.name !== 'Your Location' && data.name !== 'Unknown'
                    ? data.name
                    : (location.city !== 'Loading...' && location.city !== 'Detecting...' ? location.city : 'Your Location');

                loc = {
                    city: cityName,
                    region: data.sys?.country === 'IN' ? 'India' : data.sys?.country || '',
                    isManual: false,
                    lat: lat || (data.coord?.lat),
                    lon: lon || (data.coord?.lon)
                };
            }

            setLocation(loc);
            localStorage.setItem('cached_location', JSON.stringify(loc));
            localStorage.setItem('cached_weather', JSON.stringify(data));
            localStorage.setItem('weather_cache_time', Date.now().toString());

        } catch (error) {
            console.error("Weather fetch error:", error);
            if (locationOverride) {
                alert("Could not fetch weather data. Please check your internet connection.");
                const fallback = { ...locationOverride, isManual: true };
                setWeather({
                    main: { temp: 28, humidity: 64, feels_like: 30 },
                    weather: [{ main: 'Cloudy', description: 'Offline' }],
                    wind: { speed: 12 },
                    name: locationOverride.city
                });
                setLocation(fallback);
                localStorage.setItem('cached_location', JSON.stringify(fallback));
            } else {
                // Initial Load Fail fallback
                setWeather({
                    main: { temp: 28, humidity: 64, feels_like: 30 },
                    weather: [{ main: 'Cloudy', description: 'Network error' }],
                    wind: { speed: 12 },
                    name: 'Guntur'
                });
                setLocation({ city: 'Guntur', region: 'Andhra Pradesh', isManual: false });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchCity.trim()) return;

        try {
            setLoading(true);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(searchCity)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const { lat, lon, address } = result;

                // Village, Mandal, District (High Precision Parsing)
                const village = address.village || address.hamlet || address.neighbourhood || address.suburb || address.residential || address.town || "";
                const mandal = address.subdistrict || address.municipality || address.city_district || address.city || "";
                const district = address.county || address.district || address.state_district || "";
                const state = address.state || "";

                const parts = [];
                if (village) parts.push(village);
                if (mandal && !parts.some(p => p.toLowerCase() === mandal.toLowerCase())) {
                    parts.push(mandal);
                }
                if (district && !parts.some(p => p.toLowerCase() === district.toLowerCase())) {
                    parts.push(district);
                }

                const localName = parts.length > 0 ? parts.join(", ") : result.name;
                const regionLabel = state || address.country || "";

                await fetchWeather(lat, lon, { city: localName, region: regionLabel, isManual: true });
            } else {
                alert('Location not found. Please check the spelling.');
                setLoading(false);
            }
        } catch (err) {
            console.error("Geocoding failed:", err);
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    // This explicitly resets to automatic (isManual = false)
                    await fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                async (error) => {
                    console.log("Geolocation error, using IP fallback:", error);
                    await fetchWeather(); // Server-side IP fallback
                }
            );
        } else {
            fetchWeather();
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <MapPin size={18} /> {location.city}{location.region ? `, ${location.region}` : ''}
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter">{t('localWeather')}</h1>
                    <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Farm-specific localized forecasting</p>
                </div>
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
                    <div className="relative flex-1 md:w-80 group">
                        <input
                            type="text"
                            placeholder="Search Village, District, State..."
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-14 focus:ring-2 focus:ring-primary outline-none font-bold text-slate-900 shadow-sm transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                            title="Search"
                        >
                            <Search size={18} />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="p-4 bg-primary text-white rounded-2xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2 font-bold whitespace-nowrap"
                        title="Use my location"
                    >
                        <Navigation size={20} />
                        <span className="md:hidden">Use My Location</span>
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
                        className="lg:col-span-2 bg-gradient-to-br from-primary to-primary-dark p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] text-white shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <CloudSun size={300} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                            <div className="space-y-4">
                                <p className="text-xl font-bold opacity-80">
                                    {t('today')}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    {localStorage.getItem('weather_cache_time') && (
                                        <span className="block text-[10px] uppercase tracking-tighter opacity-50 mt-1 font-black">
                                            Last Updated: {new Date(parseInt(localStorage.getItem('weather_cache_time'))).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </p>
                                <h2 className="text-7xl sm:text-9xl font-black">{weather?.main?.temp ? Math.round(weather.main.temp) : '--'}°C</h2>
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
                                    <div className="flex items-center gap-2 text-lg font-bold leading-tight">
                                        {location.city}{location.region ? `, ${location.region}` : ''}
                                    </div>
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

            {/* Planting & Spraying Advisor (New Plantix Feature) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden relative group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                        <Droplets size={120} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg">
                                <Wind size={24} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-900">Spraying Advisor</h4>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Pesticide & Fertilizer Timing</p>
                            </div>
                        </div>

                        {/* Spray Rating */}
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400">Current Rating</span>
                                <h5 className={`text-2xl font-black ${(weather?.wind?.speed > 15 || weather?.weather?.[0]?.main === 'Rain') ? 'text-red-600' :
                                    (weather?.wind?.speed > 10 || weather?.main?.temp > 35) ? 'text-orange-500' : 'text-emerald-600'
                                    }`}>
                                    {(weather?.wind?.speed > 15 || weather?.weather?.[0]?.main === 'Rain') ? 'FORBIDDEN' :
                                        (weather?.wind?.speed > 10 || weather?.main?.temp > 35) ? 'RISKY' : 'OPTIMAL'}
                                </h5>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${(weather?.wind?.speed > 15 || weather?.weather?.[0]?.main === 'Rain') ? 'bg-red-600' :
                                (weather?.wind?.speed > 10 || weather?.main?.temp > 35) ? 'bg-orange-500' : 'bg-emerald-600'
                                }`}>
                                <CheckCircle size={24} />
                            </div>
                        </div>

                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <div className={`w-2 h-2 rounded-full ${weather?.wind?.speed < 10 ? 'bg-green-500' : 'bg-red-500'}`} />
                                Wind Speed: {weather?.wind?.speed || 0} km/h {weather?.wind?.speed < 10 ? '(Safe)' : '(Drift Risk)'}
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <div className={`w-2 h-2 rounded-full ${weather?.main?.temp < 35 ? 'bg-green-500' : 'bg-red-500'}`} />
                                Temperature: {Math.round(weather?.main?.temp) || 0}°C {weather?.main?.temp < 35 ? '(Safe)' : '(Evaporation Risk)'}
                            </li>
                        </ul>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl overflow-hidden relative group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Navigation size={120} />
                    </div>
                    <div className="relative z-10 space-y-8">
                        <div>
                            <h4 className="text-2xl font-black">7-Day Spray Timeline</h4>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Forecasted Optimal Windows</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { day: 'Mon', rating: 'Optimal', color: 'bg-emerald-500' },
                                { day: 'Tue', rating: 'Risky (Rain)', color: 'bg-red-500' },
                                { day: 'Wed', rating: 'Optimal', color: 'bg-emerald-500' },
                                { day: 'Thu', rating: 'Good', color: 'bg-emerald-500' },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl">
                                    <span className="font-black text-sm">{s.day}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase opacity-60">{s.rating}</span>
                                        <div className={`w-3 h-3 rounded-full ${s.color} shadow-[0_0_10px_rgba(16,185,129,0.3)]`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Existing Farming Advisory Section */}
            <div className="card-base p-10 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-900">
                    <CloudSun size={150} />
                </div>
                <div className="bg-emerald-500 text-white p-6 rounded-3xl shadow-lg shadow-emerald-200 z-10">
                    <Thermometer size={40} />
                </div>
                <div className="space-y-3 z-10 flex-1">
                    <h4 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        {t('CropAdvisory')} <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">Live AI</span>
                    </h4>
                    <p className="text-lg text-slate-700 font-medium leading-relaxed">
                        {(() => {
                            if (!weather) return 'Loading advice...';
                            const temp = weather.main?.temp || 0;
                            const humidity = weather.main?.humidity || 0;
                            const wind = weather.wind?.speed || 0;
                            const condition = weather.weather?.[0]?.main?.toLowerCase() || '';

                            if (condition.includes('Rain') || condition.includes('Drizzle')) return t('RainRisk');
                            if (wind > 20) return t('WindRisk');
                            if (temp > 35) return t('HighTempRisk');
                            if (temp < 10) return t('LowTempRisk');
                            if (humidity > 80) return t('HighHumRisk');
                            return t('GoodConditions');
                        })()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Weather;
