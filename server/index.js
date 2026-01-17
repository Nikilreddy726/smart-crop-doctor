const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Firebase Admin
let serviceAccount;
let firebaseInitialized = false;
try {
    serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "smart-doctor-crop.firebasestorage.app"
    });
    firebaseInitialized = true;
    console.log("Firebase initialized successfully");
} catch (e) {
    console.error("Firebase Service Account not found or invalid.");
}

const db = firebaseInitialized ? admin.firestore() : null;
const bucket = firebaseInitialized ? admin.storage().bucket() : null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage configuration for Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const AI_SERVICE_URL = 'https://smart-crop-doctor.onrender.com';

const keepAIWarm = async () => {
    try { await axios.get(AI_SERVICE_URL, { timeout: 15000 }); } catch (e) { }
};

if (process.env.PORT) {
    setInterval(keepAIWarm, 8 * 60 * 1000);
    setTimeout(keepAIWarm, 5000);
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const start = Date.now();
    let aiStatus = 'offline';
    try {
        await axios.get(AI_SERVICE_URL, { timeout: 45000 });
        aiStatus = 'online';
    } catch (e) {
        if (e.response?.status === 502 || e.response?.status === 503 || e.code === 'ECONNABORTED') aiStatus = 'booting';
    }
    res.json({ server: 'online', version: '1.3.0', ai: aiStatus, firebase: firebaseInitialized, latency: Date.now() - start });
});

const jobs = new Map();

app.post('/api/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
        const jobId = "job-" + Date.now() + Math.random().toString(36).substring(7);
        jobs.set(jobId, { status: 'pending', result: null, error: null });

        (async () => {
            try {
                const maxRetries = 150;
                let attempt = 0;
                let aiResult = null;
                const FormData = require('form-data');
                while (attempt <= maxRetries) {
                    try {
                        const formData = new FormData();
                        formData.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
                        const aiRes = await axios.post(`${AI_SERVICE_URL}/predict`, formData, { headers: formData.getHeaders(), timeout: 30000 });
                        if (aiRes.data) {
                            aiResult = aiRes.data;
                            break;
                        }
                    } catch (e) {
                        const isBooting = !e.response || [502, 503, 504].includes(e.response.status) || e.code === 'ECONNABORTED';
                        if (!isBooting) throw new Error(`AI Engine Error: ${e.message}`);
                        attempt++;
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
                if (!aiResult) throw new Error("AI Engine failed to start.");
                if (aiResult.disease === 'Not a Crop') {
                    jobs.set(jobId, { status: 'completed', result: { id: null, ...aiResult, imageUrl: null } });
                    return;
                }
                let imageUrl = null;
                if (firebaseInitialized && bucket) {
                    try {
                        const blob = bucket.file(`detections/${Date.now()}_${req.file.originalname}`);
                        const blobStream = blob.createWriteStream({ metadata: { contentType: req.file.mimetype } });
                        await new Promise((resolve, reject) => { blobStream.on('error', reject).on('finish', resolve).end(req.file.buffer); });
                        try { await blob.makePublic(); } catch (e) { }
                        imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                    } catch (e) { }
                }
                let docId = "local-" + Date.now();
                if (firebaseInitialized && db) {
                    try {
                        const docSnapshot = await db.collection('predictions').add({
                            ...aiResult, imageUrl, timestamp: admin.firestore.FieldValue.serverTimestamp(),
                            userId: req.body.userId || 'anonymous',
                            location: { lat: req.body.lat ? parseFloat(req.body.lat) : null, lon: req.body.lon ? parseFloat(req.body.lon) : null }
                        });
                        docId = docSnapshot.id;
                    } catch (e) { }
                }
                jobs.set(jobId, { status: 'completed', result: { id: docId, ...aiResult, imageUrl } });
            } catch (err) {
                jobs.set(jobId, { status: 'failed', error: err.message });
            }
            setTimeout(() => jobs.delete(jobId), 15 * 60 * 1000);
        })();
        res.json({ jobId, status: 'pending' });
    } catch (error) { res.status(500).json({ error: 'Internal Server Error' }); }
});

app.get('/api/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

app.get('/api/weather', async (req, res) => {
    let { lat, lon } = req.query;
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    // Detect IP City as a weak fallback
    let ipCityName = null;
    try {
        const xForwardedFor = req.headers['x-forwarded-for'];
        const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
        const ipRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city`);
        if (ipRes.data && ipRes.data.status === 'success') {
            ipCityName = ipRes.data.city;
            if (!lat || !lon || lat === 'null' || lon === 'undefined') {
                lat = ipRes.data.lat;
                lon = ipRes.data.lon;
            }
        }
    } catch (e) { }

    const isCoordSearch = !!(lat && lon && lat !== 'null' && lon !== 'undefined');
    if (!lat || !lon) { lat = 16.3067; lon = 80.4365; }

    let locationName = ipCityName || "Your Location";

    // If we have actual coordinates, we force high-precision reverse geocoding
    if (isCoordSearch) {
        // Temporary placeholder to indicate we are processing real coords, not IP gibberish
        locationName = `Detecting... (${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)})`;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`, {
                    timeout: 8000,
                    headers: { 'User-Agent': 'SmartCropDoctor/1.3 (nikilreddy726@gmail.com)', 'Referer': 'https://smart-doctor-crop.web.app/' }
                });

                if (geoResponse.data && geoResponse.data.display_name) {
                    const a = geoResponse.data.address || {};
                    const displayChunks = (geoResponse.data.display_name || "").split(',').map(c => c.trim()).filter(Boolean);

                    const useful = displayChunks.filter(c => {
                        const low = c.toLowerCase();
                        return low !== 'india' && !/^\d{5,6}$/.test(low);
                    });

                    let vFinal = "", mFinal = "", dFinal = "", sFinal = "";

                    // 1. Identify State (Permanent)
                    sFinal = a.state || (useful.length > 0 ? useful[useful.length - 1] : "");

                    // 2. Identify District 
                    dFinal = a.state_district || a.district || a.county || "";
                    if (!dFinal) {
                        for (let i = useful.length - 1; i >= 0; i--) {
                            const low = useful[i].toLowerCase();
                            if (low.includes('district') || low.includes('dist') || useful.length - 2 === i) {
                                if (useful[i] !== sFinal) { dFinal = useful[i]; break; }
                            }
                        }
                    }

                    // 3. Identify Mandal (Keyword prioritized)
                    mFinal = a.subdistrict || a.municipality || a.city_district || a.tehsil || "";
                    if (!mFinal || mFinal === dFinal) {
                        for (let i = 0; i < useful.length; i++) {
                            const low = useful[i].toLowerCase();
                            if (low.includes('mandal') || low.includes('tehsil') || low.includes('taluk') || low.includes('block')) {
                                mFinal = useful[i]; break;
                            }
                        }
                    }
                    if (!mFinal || mFinal === dFinal) {
                        const distIdx = useful.indexOf(dFinal);
                        if (distIdx > 0) mFinal = useful[distIdx - 1];
                    }

                    // 4. Identify Village (ULTRA SPECIFIC)
                    vFinal = a.village || a.hamlet || a.town || a.suburb || a.neighbourhood || "";
                    if (!vFinal || vFinal === mFinal || vFinal === dFinal) {
                        for (let i = 0; i < useful.length; i++) {
                            const chunk = useful[i];
                            if (chunk !== mFinal && chunk !== dFinal && chunk !== sFinal) {
                                // Prefer named places over street numbers
                                if (!/^\d/.test(chunk) || chunk.length > 5) {
                                    vFinal = chunk; break;
                                }
                            }
                        }
                    }
                    if (!vFinal) vFinal = useful[0] || "";

                    const ordered = [vFinal, mFinal, dFinal, sFinal].filter(Boolean);
                    const out = [];
                    const seen = new Set();
                    ordered.forEach(val => {
                        if (!val || val === "undefined") return;
                        const norm = val.toLowerCase().replace(/\s/g, '');
                        let isDup = false;
                        seen.forEach(s => {
                            if (norm.includes(s) || s.includes(norm)) isDup = true;
                        });
                        if (!isDup) {
                            out.push(val);
                            seen.add(norm);
                        }
                    });

                    locationName = out.slice(0, 4).join(", ");
                    break;
                }
            } catch (e) {
                if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
            }
        }
    }

    // Weather Fetching
    if (API_KEY) {
        try {
            const resp = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
            const data = resp.data;
            data.name = locationName;
            return res.json(data);
        } catch (error) { }
    }

    try {
        const resp = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = resp.data;
        const weatherCodes = { 0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 95: "Thunderstorm" };
        res.json({
            name: locationName,
            main: { temp: data.current.temperature_2m, humidity: data.current.relative_humidity_2m, feels_like: data.current.apparent_temperature, temp_min: data.daily.temperature_2m_min[0], temp_max: data.daily.temperature_2m_max[0] },
            weather: [{ main: weatherCodes[data.current.weather_code] || "Variable", description: "Localized" }],
            coord: { lat, lon }
        });
    } catch (error) { res.status(500).json({ error: "Weather failed" }); }
});

app.get('/api/outbreaks', async (req, res) => {
    try {
        let outbreaks = [];
        if (firebaseInitialized && db) {
            const fourteenDaysAgo = new Date(); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const snaps = await db.collection('predictions').where('timestamp', '>=', fourteenDaysAgo).orderBy('timestamp', 'desc').limit(100).get();
            const map = new Map();
            snaps.forEach(doc => {
                const s = doc.data(); if (s.disease === 'Healthy' || s.disease === 'Not a Crop') return;
                const core = `${s.disease}_${s.location?.lat?.toFixed(1)},${s.location?.lon?.toFixed(1)}`;
                if (map.has(core)) map.get(core).count += 1; else map.set(core, { disease: s.disease, crop: s.crop, count: 1 });
            });
            outbreaks = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5).map(o => ({
                crop: o.crop || 'General', disease: o.disease, status: o.count > 4 ? 'Outbreak' : 'Monitoring', color: o.count > 2 ? 'bg-red-500' : 'bg-orange-500'
            }));
        }
        res.json(outbreaks);
    } catch (e) { res.json([]); }
});

app.get('/api/predictions', async (req, res) => {
    try {
        if (!firebaseInitialized || !db) return res.json([]);
        const snaps = await db.collection('predictions').orderBy('timestamp', 'desc').get();
        res.json(snaps.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/community', async (req, res) => {
    try {
        if (!firebaseInitialized || !db) return res.json([]);
        const snaps = await db.collection('posts').orderBy('timestamp', 'desc').get();
        res.json(snaps.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/mandi', (req, res) => res.json({ data: [] }));

app.listen(port, () => console.log(`Server port ${port}`));
