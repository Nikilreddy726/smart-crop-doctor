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

app.get('/api/health', async (req, res) => {
    const start = Date.now();
    let aiStatus = 'offline';
    try {
        await axios.get(AI_SERVICE_URL, { timeout: 45000 });
        aiStatus = 'online';
    } catch (e) {
        if (e.response?.status === 502 || e.response?.status === 503 || e.code === 'ECONNABORTED') aiStatus = 'booting';
    }
    res.json({ server: 'online', version: '1.3.2', ai: aiStatus, firebase: firebaseInitialized, latency: Date.now() - start });
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
                        if (aiRes.data) { aiResult = aiRes.data; break; }
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

    let ipCityName = null;
    try {
        const xForwardedFor = req.headers['x-forwarded-for'];
        const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
        const ipRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city`);
        if (ipRes.data && ipRes.data.status === 'success') {
            ipCityName = ipRes.data.city;
            if (!lat || !lon || lat === 'null' || lon === 'undefined') {
                lat = ipRes.data.lat; lon = ipRes.data.lon;
            }
        }
    } catch (e) { }

    const isCoordSearch = !!(lat && lon && lat !== 'null' && lon !== 'undefined');
    if (!lat || !lon) { lat = 16.3067; lon = 80.4365; }

    let locationName = ipCityName || "Your Location";
    if (isCoordSearch) {
        let foundName = null;
        // Search across progressive zoom levels: 18 (Street), 16 (Village), 14 (Mandal), 10 (District)
        for (const z of [18, 16, 14, 10]) {
            if (foundName) break;
            for (let att = 1; att <= 2; att++) {
                try {
                    const geo = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=${z}`, {
                        timeout: 8000,
                        headers: {
                            'User-Agent': 'SmartCropDoctor/1.3.2 (Support: nikilreddy726@gmail.com)',
                            'Accept-Language': 'en-US,en;q=0.9'
                        }
                    });
                    if (geo.data && (geo.data.display_name || geo.data.address)) {
                        const a = geo.data.address || {};
                        const display = geo.data.display_name || "";
                        const chunks = display.split(',').map(c => c.trim()).filter(c => c.toLowerCase() !== 'india' && !/^\d{5,6}$/.test(c));
                        let v = "", m = "", d = "", s = "";
                        s = a.state || a.region || chunks[chunks.length - 1] || "";
                        d = a.state_district || a.district || a.county || "";
                        if (!d) { for (let i = chunks.length - 1; i >= 0; i--) if (chunks[i].toLowerCase().includes('district') || chunks.length - 2 === i) if (chunks[i] !== s) { d = chunks[i]; break; } }
                        m = a.subdistrict || a.municipality || a.city_district || a.tehsil || "";
                        if (!m || m === d) { for (let i = 0; i < chunks.length; i++) if (['mandal', 'tehsil', 'taluk', 'block'].some(x => chunks[i].toLowerCase().includes(x))) { m = chunks[i]; break; } }
                        if (!m || m === d) { const idx = chunks.indexOf(d); if (idx > 0) m = chunks[idx - 1]; }
                        v = a.village || a.hamlet || a.town || a.suburb || a.neighbourhood || a.locality || "";
                        if (!v || v === m || v === d) { for (let i = 0; i < Math.min(chunks.length, 3); i++) if (chunks[i] !== m && chunks[i] !== d && chunks[i] !== s && (!/^\d/.test(chunks[i]) || chunks[i].length > 4)) { v = chunks[i]; break; } }
                        if (!v) v = chunks[0] || "";
                        const ordered = [v, m, d, s].filter(Boolean);
                        const out = []; const seen = new Set();
                        ordered.forEach(val => {
                            const norm = val.toLowerCase().replace(/\s/g, '');
                            let dup = false;
                            seen.forEach(sv => {
                                if (norm.includes(sv) || sv.includes(norm)) dup = true;
                                if (['mandal', 'tehsil', 'district'].some(x => norm.includes(x))) {
                                    const b = norm.replace('mandal', '').replace('tehsil', '').replace('district', '');
                                    if (sv.includes(b) || b.includes(sv)) dup = true;
                                }
                            });
                            if (!dup) { out.push(val); seen.add(norm); }
                        });
                        if (out.length > 0) { foundName = out.slice(0, 4).join(", "); break; }
                    }
                } catch (e) { if (att < 2) await new Promise(r => setTimeout(r, 1000)); }
            }
        }
        locationName = foundName || `Location (${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)})`;
    }

    if (API_KEY) {
        try {
            const resp = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
            const data = resp.data; data.name = locationName; return res.json(data);
        } catch (error) { }
    }
    res.json({ name: locationName, main: { temp: 28 }, weather: [{ main: "Clear" }], coord: { lat, lon } });
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

app.listen(port, () => console.log(`Server port ${port}`));
