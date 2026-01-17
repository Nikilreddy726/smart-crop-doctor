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
    console.error("Firebase Service Account not found or invalid - Storage features will be disabled.");
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
    limits: { fileSize: 10 * 1024 * 1024 } // Increased to 10MB
});

// --- PERMANENT SOLUTION: RENDER COLD-START PRE-WARMER ---
const AI_SERVICE_URL = 'https://smart-crop-doctor.onrender.com';

const keepAIWarm = async () => {
    try {
        console.log("[WARMER] Pinging AI Engine...");
        await axios.get(AI_SERVICE_URL, { timeout: 15000 });
        console.log("[WARMER] AI Engine is Awake");
    } catch (e) {
        console.log("[WARMER] AI Engine wake-up initiated...");
    }
};

if (process.env.PORT) {
    setInterval(keepAIWarm, 8 * 60 * 1000);
    setTimeout(keepAIWarm, 5000);
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const start = Date.now();
    let aiStatus = 'offline';
    let aiError = null;

    try {
        await axios.get(AI_SERVICE_URL, { timeout: 45000 });
        aiStatus = 'online';
    } catch (e) {
        aiError = e.response ? `HTTP ${e.response.status}` : e.message;
        if (e.response?.status === 502 || e.response?.status === 503 || e.code === 'ECONNABORTED') {
            aiStatus = 'booting';
        } else {
            aiStatus = 'offline';
        }
    }

    res.json({
        server: 'online',
        version: '1.2.6',
        ai: aiStatus,
        aiDetail: aiError,
        aiUrl: AI_SERVICE_URL,
        firebase: firebaseInitialized,
        latency: Date.now() - start
    });
});

const jobs = new Map();

app.post('/api/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

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
                        formData.append('file', req.file.buffer, {
                            filename: req.file.originalname,
                            contentType: req.file.mimetype
                        });

                        const aiRes = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
                            headers: formData.getHeaders(),
                            timeout: 30000
                        });

                        if (aiRes.data) {
                            aiResult = aiRes.data;
                            break;
                        }
                    } catch (e) {
                        const isBooting = !e.response || [502, 503, 504].includes(e.response.status) || e.code === 'ECONNABORTED';
                        if (!isBooting) throw new Error(`AI Engine Error: ${e.response?.data?.error || e.message}`);
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
                        await new Promise((resolve, reject) => {
                            blobStream.on('error', reject).on('finish', resolve).end(req.file.buffer);
                        });
                        try { await blob.makePublic(); } catch (e) { }
                        imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                    } catch (e) { }
                }

                let docId = "local-" + Date.now();
                if (firebaseInitialized && db) {
                    try {
                        const docSnapshot = await db.collection('predictions').add({
                            ...aiResult,
                            imageUrl,
                            timestamp: admin.firestore.FieldValue.serverTimestamp(),
                            userId: req.body.userId || 'anonymous',
                            location: {
                                lat: req.body.lat ? parseFloat(req.body.lat) : null,
                                lon: req.body.lon ? parseFloat(req.body.lon) : null
                            }
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
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

app.get('/api/weather', async (req, res) => {
    let { lat, lon } = req.query;
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    let ipCityName = null;
    try {
        const xForwardedFor = req.headers['x-forwarded-for'];
        const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
        const ipRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city`);
        if (ipRes.data && ipRes.data.status === 'success') {
            ipCityName = ipRes.data.city;
            if (!lat || !lon || lat === 'null' || lon === 'null' || lat === 'undefined' || lon === 'undefined') {
                lat = ipRes.data.lat;
                lon = ipRes.data.lon;
            }
        }
    } catch (e) { }

    if (!lat || !lon) {
        lat = 16.3067;
        lon = 80.4365;
    }

    let locationName = ipCityName || "Your Location";
    if (lat && lon) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`, {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'SmartCropDoctor/1.2 (nikilreddy726@gmail.com)',
                        'Referer': 'https://smart-doctor-crop.web.app/'
                    }
                });

                if (geoResponse.data && geoResponse.data.address) {
                    const a = geoResponse.data.address;
                    const chunks = (a.display_name || "").split(',').map(c => c.trim());

                    // --- FINAL PERMANENT SOLUTION: STRICT HIERARCHY ---
                    let v = a.village || a.hamlet || a.town || a.suburb || chunks[0] || "";
                    let m = a.subdistrict || a.municipality || "";
                    let d = a.state_district || a.district || a.county || "";
                    let s = a.state || "";

                    // Keyword Scan (Override with direct matches)
                    chunks.forEach(chunk => {
                        const low = chunk.toLowerCase();
                        if (low.includes('mandal') || low.includes('tehsil') || low.includes('taluk') || low.includes('block')) m = chunk;
                        else if (low.includes('district') || low.includes('dist')) d = chunk;
                    });

                    // De-duplicate and Join in strict [Village, Mandal, District, State] order
                    const finalParts = [];
                    const added = new Set();
                    [v, m, d, s].forEach(part => {
                        if (!part) return;
                        const normal = part.toLowerCase().replace(/\s/g, '');
                        let isDup = false;
                        added.forEach(existing => {
                            if (normal.includes(existing) || existing.includes(normal)) isDup = true;
                        });
                        if (!isDup) {
                            finalParts.push(part);
                            added.add(normal);
                        }
                    });

                    locationName = finalParts.slice(0, 4).join(", ");
                    break;
                }
            } catch (e) {
                if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    if (API_KEY) {
        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
            const data = response.data;
            data.name = locationName;
            return res.json(data);
        } catch (error) { }
    }

    try {
        const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = response.data;
        const current = data.current;
        const weatherCodes = { 0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 95: "Thunderstorm" };
        const weatherDesc = weatherCodes[current.weather_code] || "Variable";

        res.json({
            name: locationName,
            main: { temp: current.temperature_2m, humidity: current.relative_humidity_2m, feels_like: current.apparent_temperature, temp_min: data.daily.temperature_2m_min[0], temp_max: data.daily.temperature_2m_max[0] },
            weather: [{ main: weatherDesc, description: weatherDesc }],
            coord: { lat, lon }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

app.get('/api/outbreaks', async (req, res) => {
    try {
        let outbreaks = [];
        if (firebaseInitialized && db) {
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const snapshot = await db.collection('predictions').where('timestamp', '>=', fourteenDaysAgo).orderBy('timestamp', 'desc').limit(100).get();
            const map = new Map();
            snapshot.forEach(doc => {
                const s = doc.data();
                if (s.disease === 'Healthy' || s.disease === 'Not a Crop') return;
                const key = `${s.disease}_${s.location?.lat?.toFixed(1) || '0'},${s.location?.lon?.toFixed(1) || '0'}`;
                if (map.has(key)) map.get(key).count += 1;
                else map.set(key, { disease: s.disease, crop: s.crop, count: 1 });
            });
            outbreaks = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5).map(o => ({
                crop: o.crop || 'General', disease: o.disease, status: o.count > 5 ? 'Critical' : 'Alert', color: o.count > 2 ? 'bg-red-500' : 'bg-orange-500'
            }));
        }
        res.json(outbreaks);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/predictions', async (req, res) => {
    try {
        if (!firebaseInitialized || !db) return res.json([]);
        const snapshot = await db.collection('predictions').orderBy('timestamp', 'desc').get();
        res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/community', async (req, res) => {
    try {
        if (!firebaseInitialized || !db) return res.json([{ id: 'c1', author: 'Team', content: 'Welcome!', timestamp: new Date(), likes: 0, replies: 0 }]);
        const snapshot = await db.collection('posts').orderBy('timestamp', 'desc').get();
        res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/mandi', (req, res) => {
    res.json({ data: [] }); // Placeholder for simplicity
});

app.listen(port, () => console.log(`Server running on port ${port}`));
