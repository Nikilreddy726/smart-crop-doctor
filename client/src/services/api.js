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

export const detectDisease = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post('/detect', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
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

export const getWeather = async (lat, lon) => {
    const response = await api.get('/weather', { params: { lat, lon } });
    return response.data;
};

export const getMandiPrices = async () => {
    const response = await api.get('/mandi');
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

export default api;
