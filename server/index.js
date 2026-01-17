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

app.get('/api/health', (req, res) => res.json({ server: 'online', version: '1.3.5', firebase: firebaseInitialized }));

app.get('/api/weather', async (req, res) => {
    let { lat, lon } = req.query;
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    let ipCity = null;
    try {
        const xf = req.headers['x-forwarded-for'];
        const ip = xf ? xf.split(',')[0].trim() : req.socket.remoteAddress;
        const ipRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city`, { timeout: 3000 });
        if (ipRes.data?.status === 'success') {
            ipCity = ipRes.data.city;
            if (!lat || !lon || lat === 'null' || lat === 'undefined') { lat = ipRes.data.lat; lon = ipRes.data.lon; }
        }
    } catch (e) { }

    const isActualGPS = !!(lat && lon && lat !== 'null' && lat !== 'undefined');
    if (!lat || !lon) { lat = 16.3067; lon = 80.4365; }

    let locationName = ipCity || "Your Location";
    let foundName = null;

    if (isActualGPS) {
        // --- LEVEL 1: Nominatim (High Detail) ---
        for (const z of [18, 14, 10]) {
            if (foundName) break;
            try {
                const geo = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=${z}`, {
                    timeout: 7000,
                    headers: { 'User-Agent': `SmartCropDoctorApp/2.0 (nikilreddy726@gmail.com)`, 'Referer': 'https://smart-doctor-crop.web.app/' }
                });

                if (geo.data && geo.data.display_name) {
                    const a = geo.data.address || {};
                    const chunks = (geo.data.display_name || "").split(',').map(c => c.trim()).filter(c => c.toLowerCase() !== 'india' && !/^\d{5,6}$/.test(c));

                    let v = a.village || a.hamlet || a.town || a.suburb || a.neighbourhood || "";
                    let m = a.subdistrict || a.municipality || a.city_district || a.tehsil || "";
                    let d = a.state_district || a.district || a.county || "";
                    let s = a.state || (chunks.length > 0 ? chunks[chunks.length - 1] : "");

                    if (!d) { for (let i = chunks.length - 1; i >= 0; i--) if (chunks[i].toLowerCase().includes('district') || chunks.length - 2 === i) if (chunks[i] !== s) { d = chunks[i]; break; } }
                    if (!m || m === d) { for (let i = 0; i < chunks.length; i++) if (['mandal', 'tehsil', 'taluk', 'block'].some(x => chunks[i].toLowerCase().includes(x))) { m = chunks[i]; break; } }
                    if (!m || m === d) { const idx = chunks.indexOf(d); if (idx > 0) m = chunks[idx - 1]; }
                    if (!v || v === m || v === d) { for (let i = 0; i < Math.min(chunks.length, 3); i++) if (chunks[i] !== m && chunks[i] !== d && chunks[i] !== s && (!/^\d/.test(chunks[i]) || chunks[i].length > 4)) { v = chunks[i]; break; } }
                    if (!v) v = chunks[0] || "";

                    const ordered = [v, m, d, s].filter(Boolean);
                    const clean = [];
                    const seen = new Set();
                    ordered.forEach(val => {
                        const norm = val.toLowerCase().replace(/\s/g, '');
                        let isDup = false;
                        seen.forEach(prev => {
                            if (norm.includes(prev) || prev.includes(norm)) isDup = true;
                            const roots = ['mandal', 'tehsil', 'district', 'dist'];
                            let n2 = norm; roots.forEach(r => n2 = n2.replace(r, ''));
                            let p2 = prev; roots.forEach(r => p2 = p2.replace(r, ''));
                            if (n2 === p2 && n2.length > 3) isDup = true;
                        });
                        if (!isDup) { clean.push(val); seen.add(norm); }
                    });
                    if (clean.length > 0) foundName = clean.slice(0, 4).join(", ");
                }
            } catch (e) { }
        }

        // --- LEVEL 2: BigDataCloud (Fast & Persistent) ---
        if (!foundName) {
            try {
                const bdc = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`, { timeout: 4000 });
                if (bdc.data) {
                    const b = bdc.data;
                    const village = b.locality || b.village || "";
                    const mandal = b.principalSubdivision || "";
                    const district = b.city || "";
                    const state = b.principalSubdivision || "";
                    // Only use if we got at least something better than raw coords
                    if (village || district) {
                        foundName = [village, mandal, district, state]
                            .filter((v, i, a) => v && a.indexOf(v) === i)
                            .slice(0, 4).join(", ");
                    }
                }
            } catch (e) { }
        }

        // --- LEVEL 3: OpenWeather Geocoding ---
        if (!foundName && API_KEY) {
            try {
                const owmGeo = await axios.get(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`, { timeout: 4000 });
                if (owmGeo.data?.length > 0) {
                    const g = owmGeo.data[0];
                    foundName = [g.name, g.state].filter(Boolean).join(", ");
                }
            } catch (e) { }
        }
    }

    if (API_KEY) {
        try {
            const wr = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
            const data = wr.data;
            if (foundName) {
                locationName = foundName;
            } else if (data.name && data.name !== "Your Location" && data.name !== "") {
                locationName = data.name;
            } else if (isActualGPS) {
                locationName = `Village Surroundings, ${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)}`;
            }
            data.name = locationName;
            return res.json(data);
        } catch (e) { }
    }

    locationName = foundName || (isActualGPS ? `Local Village, ${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)}` : locationName);
    res.json({ name: locationName, main: { temp: 28 }, weather: [{ main: "Clear" }], coord: { lat, lon } });
});

app.get('/api/predictions', async (req, res) => {
    if (!db) return res.json([]);
    try {
        const snap = await db.collection('predictions').orderBy('timestamp', 'desc').get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { res.json([]); }
});

app.listen(port, () => console.log(`Server v1.3.5 running on ${port}`));
