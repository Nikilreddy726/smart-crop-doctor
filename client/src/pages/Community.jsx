import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Heart, Share2, Plus, Users, Trash2, Clock,
    Loader2, X, Send, Camera, Leaf, AlertTriangle, Lightbulb,
    TrendingUp, Award, MapPin, ChevronDown, ThumbsUp, Bookmark,
    Search, Bug, Sprout, HelpCircle, CheckCircle, Star
} from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';
import { getPosts, deletePost, createPost, likePost, commentPost } from '../services/api';

// Post type config like Plantex
const POST_TYPES = [
    { id: 'disease', label: 'diseaseReport', icon: Bug, color: 'text-red-600 bg-red-50', border: 'border-red-200', badge: 'bg-red-500' },
    { id: 'discussion', label: 'discussion', icon: MessageSquare, color: 'text-blue-600 bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-500' },
    { id: 'tip', label: 'farmTip', icon: Lightbulb, color: 'text-amber-600 bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500' },
    { id: 'success', label: 'successStory', icon: Award, color: 'text-green-600 bg-green-50', border: 'border-green-200', badge: 'bg-green-500' },
    { id: 'help', label: 'needHelp', icon: HelpCircle, color: 'text-purple-600 bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-500' },
];

const CROP_TAGS = ['Paddy', 'Wheat', 'Tomato', 'Cotton', 'Maize', 'Chilli', 'Onion', 'Potato', 'Sugarcane', 'Turmeric', 'Groundnut', 'Soyabean', 'Banana', 'Mango', 'Other'];

const getPostTypeConfig = (type) => POST_TYPES.find(t => t.id === type) || POST_TYPES[1];

const Community = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [postType, setPostType] = useState('discussion');
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedCrops, setSelectedCrops] = useState([]);
    const [isPosting, setIsPosting] = useState(false);
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [savedPosts, setSavedPosts] = useState(new Set());
    const textareaRef = useRef(null);

    const fetchPosts = async () => {
        try {
            const data = await getPosts();
            setPosts(data);
        } catch (err) {
            console.error('Community Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(); }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm(t('confirmDeleteExt') || 'Delete this post?')) return;
        try {
            await deletePost(id);
            setPosts(posts.filter(p => p.id !== id));
        } catch (err) { console.error('Delete failed', err); }
    };

    const handleLike = async (id) => {
        try {
            await likePost(id);
            setPosts(posts.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p));
        } catch (err) { console.error('Like failed:', err); }
    };

    const handleSave = (id) => {
        setSavedPosts(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleCommentSubmit = async (postId) => {
        if (!commentText.trim()) return;
        try {
            const result = await commentPost(postId, commentText, user?.displayName || 'Farmer');
            setPosts(posts.map(p => {
                if (p.id !== postId) return p;
                return { ...p, comments: [...(p.comments || []), result.comment], replies: (p.replies || 0) + 1 };
            }));
            setCommentText('');
        } catch (err) { console.error('Comment failed:', err); }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        setIsPosting(true);
        try {
            const newPost = await createPost(
                newPostContent,
                user?.displayName || 'Farmer',
                user?.photoURL || null
            );
            const optimisticPost = {
                ...newPost, type: postType, location: 'India',
                comments: [], crops: selectedCrops
            };
            setPosts([optimisticPost, ...posts]);
            setNewPostContent('');
            setSelectedCrops([]);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Failed to create post:', err);
            setIsModalOpen(false);
            fetchPosts();
        } finally {
            setIsPosting(false);
        }
    };

    const getInitials = (name) => (name || 'F').charAt(0).toUpperCase();
    const AVATAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const getAvatarColor = (name) => AVATAR_COLORS[(name || '').length % AVATAR_COLORS.length];

    const formatDate = (ts) => {
        if (!ts) return t('justNow') || 'Just now';
        try {
            const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
            const diff = Date.now() - d;
            if (diff < 60000) return t('justNow') || 'Just now';
            if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('mins') || 'm'} ${t('ago') || 'ago'}`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('hrs') || 'h'} ${t('ago') || 'ago'}`;
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } catch { return t('justNow') || 'Just now'; }
    };

    const TABS = [
        { id: 'all', label: 'allPosts', icon: Users },
        { id: 'disease', label: 'diseaseReport', icon: Bug },
        { id: 'tip', label: 'tips', icon: Lightbulb },
        { id: 'success', label: 'success', icon: Award },
        { id: 'help', label: 'help', icon: HelpCircle },
    ];

    const filteredPosts = posts.filter(post => {
        const matchTab = activeTab === 'all' || post.type === activeTab;
        const matchSearch = !searchQuery || (post.content || '').toLowerCase().includes(searchQuery.toLowerCase()) || (post.author || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    const trendingCrops = ['Tomato', 'Paddy', 'Cotton', 'Wheat'];

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-24 px-4">
            <div className="max-w-5xl mx-auto">

                {/* HEADER */}
                <div className="mb-8">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center">
                                    <Leaf className="text-white" size={22} />
                                </div>
                                {t('communityTitle2') || 'Crop Community'}
                            </h1>
                            <p className="text-slate-500 font-semibold text-sm mt-1">{t('communitySubtitleTagline') || 'Connect · Learn · Share with Indian Farmers'}</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide shadow-xl shadow-green-200 hover:bg-green-700 transition-all active:scale-95"
                        >
                            <Plus size={20} /> {t('newPostContent') || 'New Post'}
                        </button>
                    </div>

                    {/* Trending pills */}
                    <div className="flex items-center gap-3 mt-5 flex-wrap">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-green-500" /> {t('trending') || 'Trending:'}
                        </span>
                        {trendingCrops.map(crop => (
                            <button key={crop} onClick={() => setSearchQuery(crop)}
                                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-all shadow-sm">
                                🌿 {t(crop) || crop}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SEARCH + FILTER ROW */}
                <div className="flex gap-3 mb-6 flex-wrap">
                    <div className="flex-1 min-w-[200px] flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                        <Search size={18} className="text-slate-400 shrink-0" />
                        <input
                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t('searchCommunity') || "Search posts, crops, farmers..."} className="bg-transparent outline-none w-full text-sm font-semibold text-slate-700 placeholder:text-slate-300"
                        />
                        {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} className="text-slate-400 hover:text-slate-600" /></button>}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wide whitespace-nowrap transition-all ${active ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'}`}
                            >
                                <Icon size={15} /> {t(tab.label) || tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Feed */}
                    <div className="lg:col-span-2 space-y-5">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border border-slate-100">
                                <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('loadingCommunity') || 'Loading Community...'}</p>
                            </div>
                        ) : filteredPosts.length > 0 ? (
                            filteredPosts.map((post, idx) => {
                                const cfg = getPostTypeConfig(post.type);
                                const Icon = cfg.icon;
                                const isExpanded = expandedPostId === post.id;
                                const isSaved = savedPosts.has(post.id);
                                const isOwner = user && (post.userId === user.uid || post.author === user.displayName);

                                return (
                                    <motion.div key={post.id}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                                    >
                                        {/* Type accent bar */}
                                        <div className={`h-1 ${cfg.badge} w-full`} />

                                        <div className="p-6">
                                            {/* Author Row */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md"
                                                            style={{ backgroundColor: getAvatarColor(post.author) }}>
                                                            {getInitials(post.author)}
                                                        </div>
                                                        {(post.verified || post.likes > 5) && (
                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                                                                <CheckCircle size={10} className="text-white fill-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-black text-slate-900">{post.author || 'Farmer'}</span>
                                                            <span className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.color}`}>
                                                                <Icon size={10} /> {t(cfg.label) || cfg.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold mt-0.5">
                                                            <Clock size={11} className="text-green-500" />
                                                            {formatDate(post.timestamp)}
                                                            {post.location && <><MapPin size={11} /> {post.location}</>}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isOwner && (
                                                    <button onClick={(e) => handleDelete(e, post.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <p className="text-slate-700 font-semibold leading-relaxed text-[15px] mb-4">{post.content}</p>

                                            {/* Crop Tags */}
                                            {post.crops && post.crops.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {post.crops.map(crop => (
                                                        <span key={crop} className="flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-black px-3 py-1 rounded-full border border-green-200">
                                                            <Sprout size={11} /> {t(crop) || crop}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-50 flex-wrap">
                                                <button onClick={() => handleLike(post.id)}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all ${post.likes > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500'}`}>
                                                    <Heart size={16} className={post.likes > 0 ? 'fill-red-500' : ''} />
                                                    {post.likes || 0}
                                                </button>

                                                <button onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all ${isExpanded ? 'bg-green-100 text-green-700' : 'bg-slate-50 text-slate-500 hover:bg-green-50 hover:text-green-700'}`}>
                                                    <MessageSquare size={16} />
                                                    {post.replies || 0} {isExpanded ? t('close') || 'Hide' : t('replies') || 'Reply'}
                                                </button>

                                                <button onClick={() => handleSave(post.id)}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all ${isSaved ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500 hover:bg-amber-50 hover:text-amber-600'}`}>
                                                    <Bookmark size={16} className={isSaved ? 'fill-amber-500' : ''} />
                                                    {isSaved ? t('saveToHistory') || 'Saved' : t('save') || 'Save'}
                                                </button>

                                                <button className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-black text-xs transition-all">
                                                    <Share2 size={16} /> {t('share') || 'Share'}
                                                </button>
                                            </div>

                                            {/* Comments */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                        <div className="pt-4 mt-4 border-t border-dashed border-slate-200 space-y-4">
                                                            {(post.comments || []).map((c, i) => (
                                                                <div key={i} className="flex gap-3">
                                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                                                                        style={{ backgroundColor: getAvatarColor(c.author) }}>
                                                                        {getInitials(c.author)}
                                                                    </div>
                                                                    <div className="flex-1 bg-slate-50 p-3 rounded-2xl rounded-tl-none">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-xs font-black text-slate-900">{c.author}</span>
                                                                            <span className="text-[10px] text-slate-400">{formatDate(c.timestamp)}</span>
                                                                        </div>
                                                                        <p className="text-sm text-slate-600 font-medium">{c.text}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="flex gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                                                    {getInitials(user?.displayName)}
                                                                </div>
                                                                <div className="flex-1 flex gap-2">
                                                                    <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                                                                        onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.id)}
                                                                        placeholder={t('writeComment') || "Write a reply..."} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-400" />
                                                                    <button onClick={() => handleCommentSubmit(post.id)}
                                                                        className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-2xl font-bold flex items-center justify-center transition-all">
                                                                        <Send size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-100">
                                <Leaf className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('noDiscussions') || 'No posts found'}</p>
                                <button onClick={() => setIsModalOpen(true)} className="mt-6 bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wide shadow-lg">
                                    {t('newDiscussion') || 'Be the first to post!'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        {/* Community Stats */}
                        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-green-200">
                            <h3 className="font-black text-sm uppercase tracking-widest mb-4 opacity-80">{t('community') || 'Community'}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: t('allPosts') || 'Farmers', value: posts.length > 0 ? `${posts.length * 3}+` : '100+' },
                                    { label: t('replies') || 'Posts', value: `${posts.length}` },
                                    { label: t('state') || 'States', value: '28' },
                                    { label: t('success') || 'Solved', value: '94%' }
                                ].map(stat => (
                                    <div key={stat.label} className="bg-white/15 rounded-2xl p-3 text-center backdrop-blur-sm">
                                        <p className="text-2xl font-black">{stat.value}</p>
                                        <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Post Type Filter Cards */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-lg">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Post Types</h3>
                            <div className="space-y-2">
                                {POST_TYPES.map(pt => {
                                    const Icon = pt.icon;
                                    const count = posts.filter(p => p.type === pt.id).length;
                                    return (
                                        <button key={pt.id} onClick={() => setActiveTab(pt.id === activeTab ? 'all' : pt.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left ${activeTab === pt.id ? pt.color + ' font-black' : 'hover:bg-slate-50 text-slate-600 font-semibold'}`}>
                                            <span className="flex items-center gap-3 text-sm">
                                                <Icon size={16} /> {t(pt.label) || pt.label}
                                            </span>
                                            <span className="text-xs bg-slate-100 px-2 py-1 rounded-full font-bold">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Post */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-lg">
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-3">{t('quickShare') || 'Quick Share'}</h3>
                            <button onClick={() => setIsModalOpen(true)}
                                className="w-full text-left p-4 bg-slate-50 rounded-2xl text-slate-400 text-sm font-semibold hover:bg-green-50 hover:text-green-700 transition-all border border-slate-200 hover:border-green-300">
                                🌿 {t('shareTip') || 'Share a tip, disease, or question...'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CREATE POST MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }}
                            className="bg-white rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden">

                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-green-600 flex items-center justify-center text-white font-black">
                                        {getInitials(user?.displayName)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900">{user?.displayName || 'Farmer'}</p>
                                        <p className="text-xs text-slate-400 font-semibold">{t('postToCommunity') || 'Post to All India Community'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Post Type Selector */}
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('typeLabel') || 'Post Type'}</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {POST_TYPES.map(pt => {
                                            const Icon = pt.icon;
                                            return (
                                                <button key={pt.id} type="button" onClick={() => setPostType(pt.id)}
                                                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-all ${postType === pt.id ? pt.color + ' ' + pt.border + ' font-black' : 'border-slate-100 hover:border-slate-200 text-slate-400 font-semibold'}`}>
                                                    <Icon size={18} />
                                                    <span className="text-[9px] uppercase tracking-wide leading-tight text-center truncate w-full">{t(pt.label) || pt.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Content textarea */}
                                <textarea ref={textareaRef}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[130px] font-semibold text-slate-700 focus:ring-2 focus:ring-green-400 outline-none resize-none text-sm placeholder:text-slate-300"
                                    placeholder={t('shareExperience') || "What's on your mind, farmer?"}
                                    value={newPostContent} onChange={e => setNewPostContent(e.target.value)} autoFocus />

                                {/* Crop Tags */}
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('addTags') || 'Tag Crops (optional)'}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {CROP_TAGS.map(crop => (
                                            <button key={crop} type="button" onClick={() => setSelectedCrops(prev => prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop])}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCrops.includes(crop) ? 'bg-green-600 text-white border-green-600' : 'border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-600'}`}>
                                                {t(crop) || crop}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors text-sm border border-slate-200">
                                        {t('cancel') || 'Cancel'}
                                    </button>
                                    <button onClick={handleCreatePost} disabled={!newPostContent.trim() || isPosting}
                                        className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wide shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isPosting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                        {isPosting ? t('posting') || 'Posting...' : t('post') || 'Post'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default Community;
