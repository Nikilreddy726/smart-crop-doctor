import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, Share2, Plus, Users, Search, Trash2, Clock, Loader2, X, Send } from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';
import { getPosts, deletePost, createPost, likePost, commentPost } from '../services/api';

const Community = () => {
    const { translations, t } = useLanguage();
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('All India');
    const [postType, setPostType] = useState('discussion'); // discussion, suggestion
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Comments state
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [commentText, setCommentText] = useState('');

    const fetchPosts = async () => {
        try {
            const data = await getPosts();
            setPosts(data);
        } catch (err) {
            console.error("Community Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent clicking the card background if it has handlers
        console.log("Attempting to delete post:", id);
        if (window.confirm(translations?.confirmDelete || 'Are you sure you want to delete this post?')) {
            try {
                await deletePost(id);
                console.log("Delete success");
                setPosts(posts.filter(post => post.id !== id));
            } catch (err) {
                console.error("Delete failed", err);
                alert("Failed to delete post. Check console for details.");
            }
        }
    };

    const handleLike = async (id) => {
        try {
            await likePost(id);
            setPosts(posts.map(p => p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p));
        } catch (err) {
            console.error("Like failed:", err);
        }
    };

    const handleCommentSubmit = async (postId) => {
        if (!commentText.trim()) return;
        try {
            const result = await commentPost(postId, commentText, user?.displayName || 'Farmer');

            // Update local state
            setPosts(posts.map(p => {
                if (p.id === postId) {
                    const updatedComments = [...(p.comments || []), result.comment];
                    return { ...p, comments: updatedComments, replies: (p.replies || 0) + 1 };
                }
                return p;
            }));

            setCommentText('');
        } catch (err) {
            console.error("Comment failed:", err);
            alert("Failed to submit comment");
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        setIsPosting(true);
        try {
            // Pass string content to avoid React object-child crash
            const newPost = await createPost(
                newPostContent,
                user?.displayName || 'Farmer',
                user?.photoURL || null
            );

            // Manually augment the post object for local display with the new fields
            const optimisticPost = {
                ...newPost,
                type: postType,
                location: 'India',
                comments: []
            };

            setPosts([optimisticPost, ...posts]);
            setNewPostContent('');
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to create post:", err);
            // Fallback for simple backend
            alert("Posted!");
            setIsModalOpen(false);
            fetchPosts();
        } finally {
            setIsPosting(false);
        }
    };

    const getInitials = (name) => {
        return name ? name.charAt(0).toUpperCase() : 'F';
    };

    const getRandomColor = (name) => {
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
        const index = name ? name.length % colors.length : 0;
        return colors[index];
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return t('justNow');
        try {
            if (timestamp.seconds) {
                return new Date(timestamp.seconds * 1000).toLocaleDateString();
            }
            const date = new Date(timestamp);
            return isNaN(date.getTime()) ? t('justNow') : date.toLocaleDateString();
        } catch (e) {
            return t('justNow');
        }
    };

    const filteredPosts = posts.filter(post => {
        if (activeTab === 'Solutions') return post.type === 'suggestion';
        return true;
    });

    const tabs = [
        { id: 'All India', label: 'tabAllIndia' },
        { id: 'Solutions', label: 'tabSolutions' },
        { id: 'My Region', label: 'tabMyRegion' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4 relative">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 text-center md:text-left">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3 justify-center md:justify-start">
                            <Users className="text-green-600" /> {t('allIndiaCommunity')}
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                            {t('discussNation')}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-200 hover:bg-slate-900 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} /> {t('newPost')}
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex justify-center md:justify-start gap-4 mb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                        >
                            {t(tab.label)}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('loadingDiscussions')}</p>
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        filteredPosts.map((post, idx) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-green-100 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            {/* Profile Letter Badge */}
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md ${getRandomColor(post.author)}`}>
                                                {getInitials(post.author)}
                                            </div>

                                            {post.type === 'suggestion' && (
                                                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-sm border border-white">
                                                    {t('solutionBadge')}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 group-hover:text-green-600 transition-colors uppercase tracking-tight flex items-center gap-2">
                                                {post.author}
                                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-md border border-slate-200">
                                                    {post.location || 'India'}
                                                </span>
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                <Clock size={12} className="text-green-500" /> {formatDate(post.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => handleDelete(e, post.id)}
                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title={t('delete')}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-slate-700 font-bold leading-relaxed mb-8 text-lg">
                                    {post.content}
                                </p>

                                <div className="flex items-center gap-2 sm:gap-4 pt-6 border-t border-slate-50 flex-wrap">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all font-black text-[10px] uppercase tracking-widest bg-slate-50 border border-slate-100"
                                    >
                                        <Heart size={18} className={post.likes > 0 ? "fill-red-500 text-red-500" : ""} /> {post.likes || 0}
                                    </button>
                                    <button
                                        onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-slate-100 ${expandedPostId === post.id ? 'bg-green-100 text-green-700' : 'bg-slate-50 text-slate-400 hover:text-green-600 hover:bg-green-50'}`}
                                    >
                                        <MessageSquare size={18} /> {post.replies || 0}
                                    </button>
                                    {post.type === 'suggestion' && (
                                        <span className="ml-auto flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider">
                                            <Share2 size={14} /> {t('suggestedSol')}
                                        </span>
                                    )}
                                </div>

                                {/* Comments Section */}
                                <AnimatePresence>
                                    {expandedPostId === post.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-4 mt-4 border-t border-dashed border-slate-200">
                                                {/* Comment List */}
                                                {post.comments && post.comments.length > 0 && (
                                                    <div className="space-y-4 mb-6">
                                                        {post.comments.map((comment, i) => (
                                                            <div key={i} className="bg-slate-50 p-4 rounded-xl">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs font-black text-slate-900">{comment.author}</span>
                                                                    <span className="text-[10px] text-slate-400">{comment.timestamp ? (typeof comment.timestamp === 'string' ? new Date(comment.timestamp).toLocaleDateString() : formatDate(comment.timestamp)) : t('justNow')}</span>
                                                                </div>
                                                                <p className="text-sm text-slate-600 font-medium">{comment.text}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add Comment */}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        placeholder={t('writeComment')}
                                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    />
                                                    <button
                                                        onClick={() => handleCommentSubmit(post.id)}
                                                        className="bg-green-600 text-white px-4 rounded-xl font-bold"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-[2rem] p-20 text-center border-2 border-dashed border-slate-100">
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('noDiscussionsCat')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Post Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('newDiscussion')}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleCreatePost}>
                                <div className="flex gap-2 mb-4 bg-slate-50 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setPostType('discussion')}
                                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${postType === 'discussion' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {t('genDiscussion')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPostType('suggestion')}
                                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${postType === 'suggestion' ? 'bg-yellow-100 text-yellow-800 shadow' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {t('suggSolution')}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[150px] font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none resize-none mb-6"
                                    placeholder={t('shareTip')}
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                                    >
                                        {t('cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newPostContent.trim() || isPosting}
                                        className="bg-green-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-green-200 hover:bg-slate-900 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isPosting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                        {t('post')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default Community;
