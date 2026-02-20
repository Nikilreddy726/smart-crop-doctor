import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (isLocal ? 'http://localhost:5000/api' : 'https://crop-backend-avko.onrender.com/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const detectDisease = async (imageFile, location = null) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (location) {
        formData.append('lat', location.lat);
        formData.append('lon', location.lon);
    }

    const performDetection = async () => {
        try {
            const response = await api.post('/detect', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 180000 // 180s for job submission allow backend to wake AI up
            });
            return response.data;
        } catch (error) {
            console.error("Detection submission failed:", error.message);
            throw error;
        }
    };

    return performDetection();
};

export const getHistory = async () => {
    const response = await api.get('/predictions');
    return response.data;
};

export const deletePrediction = async (id) => {
    const response = await api.delete(`/predictions/${id}`);
    return response.data;
};

export const getPosts = async () => {
    const response = await api.get('/community');
    return response.data;
};

export const createPost = async (content, author, avatar) => {
    const response = await api.post('/community', { content, author, avatar });
    return response.data;
};

export const deletePost = async (id) => {
    const response = await api.delete(`/community/${id}`);
    return response.data;
};

export const likePost = async (id) => {
    const response = await api.post(`/community/${id}/like`);
    return response.data;
};

export const commentPost = async (id, text, author) => {
    const response = await api.post(`/community/${id}/comment`, { text, author });
    return response.data;
};

export const cleanLocationName = (name) => {
    if (!name || typeof name !== 'string') return name;
    const parts = name.split(',').map(p => p.trim());
    const seen = new Set();
    const final = [];
    parts.forEach(p => {
        const norm = p.toLowerCase().replace(/\s/g, '');
        if (!norm || norm === 'india') return;
        let isDup = false;
        seen.forEach(s => {
            if (norm.includes(s) || s.includes(norm)) isDup = true;
            // Also dedupe common mandal/district keywords
            if (norm.includes('mandal') || norm.includes('tehsil') || norm.includes('district')) {
                const base = norm.replace('mandal', '').replace('tehsil', '').replace('district', '');
                if (s.includes(base) || base.includes(s)) isDup = true;
            }
        });
        if (!isDup) {
            final.push(p);
            seen.add(norm);
        }
    });
    return final.slice(0, 4).join(", ");
};

export const getWeather = async (lat, lon, cb = null) => {
    const params = { lat, lon };
    if (cb) params.cb = cb;
    const response = await api.get('/weather', { params });
    const data = response.data;
    if (data.name) data.name = cleanLocationName(data.name);
    return data;
};

export const getMandiPrices = async () => {
    const response = await api.get('/mandi');
    return response.data;
};

export const getOutbreaks = async () => {
    const response = await api.get('/outbreaks');
    return response.data;
};

export const getShops = async () => {
    const response = await api.get('/shops');
    return response.data;
};

export const getProducts = async () => {
    const response = await api.get('/products');
    return response.data;
};

export const getHealth = async () => {
    try {
        const response = await api.get('/health');
        return response.data;
    } catch (e) {
        return { server: 'offline', ai: 'offline' };
    }
};

export const getSchemes = async () => {
    try {
        const response = await api.get('/schemes');
        return response.data;
    } catch (e) {
        return [];
    }
};

export default api;
