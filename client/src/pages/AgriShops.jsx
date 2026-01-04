import React from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, ShieldCheck, Phone, Navigation, Package, Star } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';

const AgriShops = () => {
    const { t } = useLanguage();

    const shops = [
        {
            name: "Patel Krishi Seva Kendra",
            owner: "Rajesh Patel",
            distance: "2.4 km",
            rating: 4.8,
            tags: ["Seeds", "Pesticides"],
            image: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&q=80&w=200",
            verified: true
        },
        {
            name: "Sai Ram Agriculture",
            owner: "V. Sai Ram",
            distance: "4.1 km",
            rating: 4.5,
            tags: ["Fertilizers", "Tools"],
            image: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&q=80&w=200",
            verified: true
        },
        {
            name: "Kumar Agri Shop",
            owner: "Satish Kumar",
            distance: "7.8 km",
            rating: 4.2,
            tags: ["Irrigation", "Pumps"],
            image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=200",
            verified: true
        }
    ];

    const products = [
        { name: "Organic Urea 46%", price: "₹266", unit: "45kg Bag", img: "📦" },
        { name: "Hybrid Paddy Seeds", price: "₹850", unit: "10kg", img: "🌾" },
        { name: "Potash MOP", price: "₹1,700", unit: "50kg Bag", img: "🧱" },
        { name: "Neem Pesticide", price: "₹450", unit: "1 Liter", img: "🧴" }
    ];

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-end"
                >
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-100 text-white">
                                <Store size={32} />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('agriShops')}</h1>
                        </div>
                        <p className="text-slate-500 font-medium">{t('nearbyShops')}</p>
                    </div>
                </motion.div>
            </div>

            {/* Shop Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {shops.map((shop, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-100 border border-slate-50 group hover:shadow-2xl transition-all duration-500"
                    >
                        <div className="relative h-48 overflow-hidden">
                            <img src={shop.image} alt={shop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                                <Star size={14} className="text-amber-500 fill-amber-500" />
                                <span className="text-xs font-black text-slate-900">{shop.rating}</span>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-black text-slate-900 leading-tight">{shop.name}</h3>
                                {shop.verified && (
                                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-full" title="Verified Seller">
                                        <ShieldCheck size={18} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mb-6">
                                <MapPin size={14} />
                                <span>{shop.distance} • {shop.owner}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-8">
                                {shop.tags.map(tag => (
                                    <span key={tag} className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-600 transition-all shadow-lg">
                                <Phone size={16} />
                                Contact Shop
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Browse Products Mini-Section */}
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                    <Package size={200} />
                </div>

                <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black tracking-tight">{t('browseProducts')}</h2>
                        <button className="text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all border border-white/20">
                            View All Items
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((p, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all cursor-pointer">
                                <div className="text-4xl mb-4">{p.img}</div>
                                <h4 className="font-bold text-lg mb-1">{p.name}</h4>
                                <p className="text-xs font-medium text-white/50 mb-4">{p.unit}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-black">{p.price}</span>
                                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                                        <Navigation size={14} className="fill-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgriShops;
