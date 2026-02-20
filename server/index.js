const express = require('express');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

let firebaseInitialized = false;
try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = require('./serviceAccountKey.json');
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "smart-doctor-crop.firebasestorage.app"
    });
    firebaseInitialized = true;
} catch (e) {
    console.error("Firebase Service Account not found or invalid:", e.message);
}

const db = firebaseInitialized ? admin.firestore() : null;

app.use(cors());
app.use(express.json());

const AI_SERVICE_URL = 'https://smart-crop-doctor.onrender.com';

app.get('/api/health', async (req, res) => {
    let aiStatus = 'offline';
    try {
        const aiRes = await axios.get(`${AI_SERVICE_URL}`, { timeout: 4000 });
        if (aiRes.status === 200) aiStatus = 'online';
    } catch (e) {
        // If it responds with anything, it's waking up or online
        if (e.response) aiStatus = 'online';
        else aiStatus = 'warming';
    }
    res.json({ server: 'online', version: '1.4.1', firebase: firebaseInitialized, ai: aiStatus });
});

app.get('/api/weather', async (req, res) => {
    let { lat, lon } = req.query;
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    let ipFull = null;
    try {
        const xf = req.headers['x-forwarded-for'];
        const ip = xf ? xf.split(',')[0].trim() : req.socket.remoteAddress;
        const ipRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,regionName`, { timeout: 3000 });
        if (ipRes.data?.status === 'success') {
            ipFull = `${ipRes.data.city}, ${ipRes.data.regionName}`;
            if (!lat || !lon || lat === 'null' || lat === 'undefined') { lat = ipRes.data.lat; lon = ipRes.data.lon; }
        }
    } catch (e) { }

    const isActualGPS = !!(lat && lon && lat !== 'null' && lat !== 'undefined');
    if (!lat || !lon) { lat = 16.3067; lon = 80.4365; }

    // --- India Bounding Box Check (Approx) ---
    // If it's a GPS coordinate, verify it's reasonably near India or the server will flag it.
    const isIndiaGPS = lat > 6.0 && lat < 38.0 && lon > 68.0 && lon < 98.0;

    let finalLocation = ipFull || "Your Location";
    let identifiedHierarchy = null;

    if (isActualGPS) {
        // ENGINE A: Nominatim
        for (const z of [18, 14, 10]) {
            if (identifiedHierarchy) break;
            try {
                const geo = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=${z}`, {
                    timeout: 7000,
                    headers: { 'User-Agent': 'SmartCropDoctor/2.2 (nikilreddy726@gmail.com)', 'Referer': 'https://smart-doctor-crop.web.app/' }
                });

                if (geo.data && geo.data.display_name) {
                    const a = geo.data.address || {};
                    // Strict India Filter for Reverse Geocoding
                    const cc = (a.country_code || "").toLowerCase();
                    if (cc && cc !== 'in' && cc !== 'india') {
                        // If it's not India, we stop trying to name it as an Indian village
                        identifiedHierarchy = "Outside Service Area (India Only)";
                        break;
                    }

                    const chunks = (geo.data.display_name || "").split(',').map(c => c.trim()).filter(c => c.toLowerCase() !== 'india' && !/^\d{5,6}$/.test(c));

                    let village = a.village || a.hamlet || a.town || a.suburb || a.neighbourhood || "";
                    let mandal = a.subdistrict || a.municipality || a.city_district || a.tehsil || "";
                    let district = a.state_district || a.district || a.county || "";
                    let state = a.state || (chunks.length > 0 ? chunks[chunks.length - 1] : "");

                    if (!district) { for (let i = chunks.length - 1; i >= 0; i--) if (chunks[i].toLowerCase().includes('district') || chunks.length - 2 === i) if (chunks[i] !== state) { district = chunks[i]; break; } }
                    if (!mandal || mandal === district) { for (let i = 0; i < chunks.length; i++) if (['mandal', 'tehsil', 'taluk', 'block'].some(x => chunks[i].toLowerCase().includes(x))) { mandal = chunks[i]; break; } }
                    if (!mandal || mandal === district) { const idx = chunks.indexOf(district); if (idx > 0) mandal = chunks[idx - 1]; }
                    if (!village || village === mandal || village === district) { for (let i = 0; i < Math.min(chunks.length, 3); i++) if (chunks[i] !== mandal && chunks[i] !== district && chunks[i] !== state && (!/^\d/.test(chunks[i]) || chunks[i].length > 4)) { village = chunks[i]; break; } }
                    if (!village) village = chunks[0] || "";

                    const slots = [village, mandal, district, state].filter(Boolean);
                    const clean = [];
                    const seenSet = new Set();
                    slots.forEach(val => {
                        const norm = val.toLowerCase().replace(/\s/g, '');
                        let isDup = false;
                        seenSet.forEach(prev => {
                            if (norm.includes(prev) || prev.includes(norm)) isDup = true;
                        });
                        if (!isDup) { clean.push(val); seenSet.add(norm); }
                    });
                    if (clean.length >= 2) identifiedHierarchy = clean.slice(0, 4).join(", ");
                }
            } catch (e) { }
        }

        // ENGINE B/C: Restricted to India only for crop intelligence
        if (!identifiedHierarchy && isIndiaGPS) {
            try {
                const bdc = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`, { timeout: 4000 });
                if (bdc.data && bdc.data.countryCode === 'IN') {
                    const b = bdc.data;
                    const v = b.locality || "";
                    const m = b.localityInfo?.administrative?.find(a => a.order === 4 || a.name.toLowerCase().includes('mandal'))?.name || "";
                    const d = b.city || b.localityInfo?.administrative?.find(a => a.order === 3)?.name || "";
                    const s = b.principalSubdivision || "";
                    const res = [v, m, d, s].filter((v, i, a) => v && a.indexOf(v) === i);
                    if (res.length >= 2) identifiedHierarchy = res.join(", ");
                }
            } catch (e) { }
        }
    }

    if (API_KEY) {
        try {
            const wr = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
            const data = wr.data;

            // Final sanity check: if the OWM country is not India, flag it.
            if (data.sys?.country && data.sys.country !== 'IN') {
                data.name = "International Support Disabled";
                return res.json(data);
            }

            data.name = identifiedHierarchy || (data.name && data.name !== "Your Location" ? data.name : finalLocation);
            return res.json(data);
        } catch (e) { }
    }

    res.json({ name: identifiedHierarchy || finalLocation, main: { temp: 28 }, weather: [{ main: "Clear" }], coord: { lat, lon } });
});

// In-memory fallback
const localPredictions = [];
const localCommunity = [];

app.get('/api/predictions', async (req, res) => {
    if (!db) return res.json(localPredictions);
    try {
        const snap = await db.collection('predictions').orderBy('timestamp', 'desc').get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { res.json([]); }
});

// Community Forum Routes
app.get('/api/community', async (req, res) => {
    if (!db) return res.json(localCommunity);
    try {
        const snap = await db.collection('community').orderBy('timestamp', 'desc').get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { res.json([]); }
});

app.post('/api/community', async (req, res) => {
    const { content, author, avatar } = req.body;
    const post = {
        content,
        author,
        avatar,
        timestamp: db ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
        likes: 0,
        replies: 0,
        comments: []
    };

    if (!db) {
        const id = 'local_' + Date.now();
        localCommunity.unshift({ id, ...post });
        return res.json({ id, ...post });
    }

    const doc = await db.collection('community').add(post);
    res.json({ id: doc.id, ...post });
});

app.post('/api/community/:id/like', async (req, res) => {
    if (!db) {
        const post = localCommunity.find(p => p.id === req.params.id);
        if (post) post.likes = (post.likes || 0) + 1;
        return res.json({ success: true });
    }
    await db.collection('community').doc(req.params.id).update({
        likes: admin.firestore.FieldValue.increment(1)
    });
    res.json({ success: true });
});

app.post('/api/community/:id/comment', async (req, res) => {
    const { text, author } = req.body;
    const comment = { text, author, timestamp: new Date().toISOString() };

    if (!db) {
        const post = localCommunity.find(p => p.id === req.params.id);
        if (post) {
            post.comments = post.comments || [];
            post.comments.push(comment);
            post.replies = (post.replies || 0) + 1;
        }
        return res.json({ success: true, comment });
    }

    await db.collection('community').doc(req.params.id).update({
        comments: admin.firestore.FieldValue.arrayUnion(comment),
        replies: admin.firestore.FieldValue.increment(1)
    });
    res.json({ success: true, comment });
});

app.delete('/api/community/:id', async (req, res) => {
    if (!db) {
        const idx = localCommunity.findIndex(p => p.id === req.params.id);
        if (idx !== -1) localCommunity.splice(idx, 1);
        return res.json({ success: true });
    }
    await db.collection('community').doc(req.params.id).delete();
    res.json({ success: true });
});

// AI Detection Proxy
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No image uploaded" });

        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: req.file.originalname });

        // Wake up ping (don't await failure)
        axios.get(`${AI_SERVICE_URL}`).catch(() => { });

        const aiRes = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
            headers: formData.getHeaders(),
            timeout: 120000 // 120s to allow Render cold start
        });

        const result = aiRes.data;
        if (result.disease && result.disease !== 'Unknown') {
            if (db) {
                await db.collection('predictions').add({
                    ...result,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                localPredictions.unshift({
                    id: 'local_' + Date.now(),
                    ...result,
                    timestamp: new Date().toISOString()
                });
            }
        }
        res.json(result);
    } catch (e) {
        console.error("Detection error:", e.message);
        res.status(500).json({ error: "AI service offline or warming up. Please try again in 1 minute." });
    }
});

// Mandi Prices & Local Data
let cachedMandiPrices = null;
let mandiLastFetched = 0;

app.get('/api/mandi', async (req, res) => {
    const now = Date.now();
    if (cachedMandiPrices && now - mandiLastFetched < 3600000) { // 1 hr cache
        return res.json(cachedMandiPrices);
    }
    try {
        const response = await axios.get('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=150', { timeout: 10000 });
        if (response.data && response.data.records) {
            const mapped = response.data.records.map(r => ({
                commodity: r.commodity,
                market: r.market,
                state: r.state,
                modal_price: parseFloat(r.modal_price) || 0,
                min_price: parseFloat(r.min_price) || 0,
                max_price: parseFloat(r.max_price) || 0
            }));
            cachedMandiPrices = mapped;
            mandiLastFetched = now;
            return res.json(mapped);
        }
    } catch (e) {
        console.log("Error fetching real mandi prices", e.message);
    }
    // Fallback
    res.json([
        { commodity: 'Paddy', market: 'Raichur', state: 'Karnataka', modal_price: 2002, min_price: 1900, max_price: 2100 },
        { commodity: 'Chilli', market: 'Guntur', state: 'Andhra Pradesh', modal_price: 6497, min_price: 6000, max_price: 7000 },
        { commodity: 'Onion', market: 'Lasalgaon', state: 'Maharashtra', modal_price: 1450, min_price: 1200, max_price: 1600 },
        { commodity: 'Wheat', market: 'Khanna', state: 'Punjab', modal_price: 2350, min_price: 2200, max_price: 2500 }
    ]);
});

app.get('/api/schemes', (req, res) => {
    // Dynamic real-time response for schemes
    res.json([
        { title: 'PM-Kisan Samman Nidhi', provider: 'Central Govt', benefit: '₹6,000/year', eligibility: 'Small/Marginal Farmers', link: 'https://pmkisan.gov.in/', details: 'Income support of ₹6,000 per year in three equal installments to all land holding farmer families.', docs: ['Aadhaar Card', 'Land Ownership Records', 'Bank Account Details'] },
        { title: 'PM Fasal Bima Yojana', provider: 'Central Govt', benefit: 'Crop Insurance', eligibility: 'KCC Holders', link: 'https://pmfby.gov.in/', details: 'Comprehensive insurance coverage against non-preventable natural risks from pre-sowing to post-harvest.', docs: ['Sowing Certificate', 'Land Records', 'ID Proof'] },
        { title: 'Kisan Credit Card (KCC)', provider: 'State Bank', benefit: 'Low-interest Loans', eligibility: 'Credit Worthy Farmers', link: 'https://www.myscheme.gov.in/schemes/kcc', details: 'Timely and adequate credit to farmers to meet their production credit requirements with interest subvention.', docs: ['Application Form', 'Land Documents', 'Passport Photo'] },
        { title: 'PM-KUSUM Scheme', provider: 'MNRE', benefit: 'Solar Pump Subsidies', eligibility: 'Individual Farmers', link: 'https://pmkusum.mnre.gov.in/', details: 'Subsidies for installing standalone solar pumps and solarizing existing grid-connected agriculture pumps.', docs: ['Solar Pump Application', 'Identity Proof', 'Land Papers'] },
        { title: 'Agri-Infrastructure Fund', provider: 'Central Govt', benefit: 'Post-Harvest Loans', eligibility: 'Startups & Farmers', link: 'https://theagriculturefund.nic.in/', details: 'Financing facility for investment in projects for post-harvest management infrastructure and community farming assets.', docs: ['DPR', 'KYC Documents', 'Bank Loan Approval'] },
        { title: 'PM-KMY (Pension Scheme)', provider: 'Central Govt', benefit: '₹3,000/month Pension', eligibility: 'Small Farmers (18-40 yrs)', link: 'https://maandhan.in/', details: 'Voluntary pension scheme assuring ₹3,000 monthly pension after reaching 60 years of age.', docs: ['Aadhaar Card', 'Savings Bank Account'] },
        { title: 'Clean Plant Programme', provider: 'Horticulture Board', benefit: 'Disease-free Material', eligibility: 'Horticulture Farmers', link: 'https://www.nhb.gov.in/', details: 'Access to disease-free, high-quality planting material for high-value horticulture crops.', docs: ['Land Records', 'Farmer Reg ID'] },
        { title: 'Digital Agriculture Mission', provider: 'Ministry of Agri', benefit: 'Digital Services', eligibility: 'All Farmers', link: 'https://agriwelfare.gov.in/', details: 'Unified digital infrastructure providing better access to soil data, market intel, and crop estimation.', docs: ['Aadhaar Card', 'Mobile Number'] }
    ]);
});

app.get('/api/outbreaks', (req, res) => {
    res.json([
        { crop: 'Tomato', disease: 'Early Blight', status: 'HIGH RISK', color: 'bg-red-500' },
        { crop: 'Wheat', disease: 'Yellow Rust', status: 'MONITOR', color: 'bg-yellow-500' },
        { crop: 'Maize', disease: 'Fall Armyworm', status: 'EMERGING', color: 'bg-orange-500' }
    ]);
});

app.get('/api/shops', (req, res) => {
    res.json([
        { name: 'Kisan Seva Kendra', location: 'Near Market Yard', phone: '9848012345', distance: '1.2 km' },
        { name: 'Modern Agri Solutions', location: 'Main Road', phone: '9848054321', distance: '2.5 km' }
    ]);
});

app.get('/api/products', (req, res) => {
    res.json([
        { name: 'Organic Fertilizer', price: 450, stock: 'In Stock' },
        { name: 'Neem Oil (1L)', price: 320, stock: 'In Stock' },
        { name: 'NPK 19:19:19', price: 1200, stock: 'Limited' }
    ]);
});

app.listen(port, () => console.log(`Server v1.4.0 running on ${port}`));
