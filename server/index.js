const express = require('express');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

let firebaseInitialized = false;
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "smart-doctor-crop.firebasestorage.app"
    });
    firebaseInitialized = true;
} catch (e) {
    console.error("Firebase Service Account not found.");
}

const db = firebaseInitialized ? admin.firestore() : null;

app.use(cors());
app.use(express.json());

const AI_SERVICE_URL = 'https://smart-crop-doctor.onrender.com';

app.get('/api/health', (req, res) => res.json({ server: 'online', version: '1.3.9', firebase: firebaseInitialized }));

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

app.get('/api/predictions', async (req, res) => {
    if (!db) return res.json([]);
    const snap = await db.collection('predictions').orderBy('timestamp', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});

app.listen(port, () => console.log(`Server v1.3.9 running on ${port}`));
