import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, ShieldCheck, Phone, Navigation, Package, Star, Loader2 } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { getShops, getProducts } from '../services/api';

const AgriShops = () => {
    const { t } = useLanguage();
    const [shops, setShops] = useState([
        {
            name: "Krishi Seva Kendra",
            owner: "Rajesh Patel",
            distance: "1.2 km",
            rating: 4.9,
            tags: ["Certified Seeds", "Expert Advice"],
            image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=400",
            verified: true,
            status: t('openNow')
        }
    ]);
    const [products, setProducts] = useState([
        { name: "Micro-Nutrient Urea", price: "₹266", unit: "45kg Bag", img: "📦", stock: t('inStock'), color: "from-emerald-500 to-green-600" },
        { name: "Hybrid Paddy V2", price: "₹850", unit: "10kg", img: "🌾", stock: t('highDemand'), color: "from-amber-500 to-orange-600" }
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [shopsData, productsData] = await Promise.all([
                    getShops(),
                    getProducts()
                ]);
                if (shopsData?.length > 0) setShops(shopsData);
                if (productsData?.length > 0) setProducts(productsData);
            } catch (error) {
                console.log("Marketplace API not reachable, using localized fallbacks");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
            {/* Header Section */}
            <div className="relative mb-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-indigo-900 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-20 text-white overflow-hidden shadow-[0_40px_100px_-20px_rgba(49,46,129,0.3)]"
                >
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-200">{t('verifiedMarketplace')}</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 leading-[0.9] tracking-tighter">
                            {t('yourLocal')} <span className="text-amber-400">{t('agriHub')}.</span>
                        </h1>
                        <p className="text-lg md:text-xl font-medium text-indigo-100 opacity-80 leading-relaxed mb-10">
                            {t('sourceInputs')}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-8 py-4 bg-amber-400 text-indigo-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-xl shadow-amber-900/20 w-full sm:w-auto md:max-w-xs">
                                {t('findNearestShop')}
                            </button>
                            <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all w-full sm:w-auto md:max-w-xs">
                                {t('priceTrends')}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Shop Cards Grid */}
            <div className="mb-24">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('verifiedPartnersNearby')}</h2>
                    <div className="h-px bg-slate-100 grow mx-8 hidden md:block" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {shops.map((shop, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[3rem] p-4 shadow-2xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-2 transition-all duration-500"
                        >
                            <div className="relative h-48 sm:h-64 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden mb-6 sm:mb-8">
                                <img src={shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex gap-2">
                                    <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl flex items-center gap-2 shadow-xl">
                                        <Star size={14} className="text-amber-500 fill-amber-500" />
                                        <span className="text-sm font-black text-slate-900">{shop.rating}</span>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-xl ${shop.status === t('openNow') ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                        }`}>
                                        {shop.status}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 pb-6 space-y-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{shop.name}</h3>
                                        {shop.verified && <ShieldCheck className="text-blue-500" size={24} />}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                                        <MapPin size={14} />
                                        <span>{shop.distance} • {t('ownedBy')} {shop.owner}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {shop.tags.map(tag => (
                                        <span key={tag} className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <button className="w-full py-4 md:py-5 bg-indigo-50 text-indigo-600 rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-indigo-100 group-hover:shadow-indigo-200 shadow-xl">
                                    <Phone size={18} />
                                    {t('instantContact')}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Premium Product Browser */}
            <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{t('liveStockExplorer')}</h2>
                        <p className="text-slate-500 font-medium">{t('regionalInventory')}</p>
                    </div>
                    <button className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all shadow-2xl w-full sm:w-auto md:max-w-md">
                        {t('fullProductCatalogue')}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-100 hover:shadow-2xl hover:border-indigo-100 group transition-all"
                        >
                            <div className={`w-20 h-20 rounded-[2rem] bg-gradient-to-br ${p.color} flex items-center justify-center text-4xl shadow-xl mb-8 group-hover:scale-110 transition-transform`}>
                                {p.img}
                            </div>

                            <div className="space-y-2 mb-8">
                                <div className="flex items-center justify-between">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${p.stock === 'Limited' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                        ● {p.stock}
                                    </span>
                                    <span className="text-slate-400 font-bold text-[10px]">{p.unit}</span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 leading-snug">{p.name}</h4>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('price')}</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tight">{p.price}</p>
                                </div>
                                <div className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center hover:bg-indigo-600 transition-all cursor-pointer shadow-lg group-hover:rotate-12">
                                    <Package size={24} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgriShops;
