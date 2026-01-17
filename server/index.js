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
// HARD-OVERRIDE: The environment variable on Render is currently pointing to a 404 URL.
// We are forcing the system to use the verified working AI engine URL.
const AI_SERVICE_URL = 'https://smart-crop-doctor.onrender.com';

const keepAIWarm = async () => {
    try {
        console.log("[WARMER] Pinging AI Engine...");
        // Use a 15s timeout to allow for container boot
        await axios.get(AI_SERVICE_URL, { timeout: 15000 });
        console.log("[WARMER] AI Engine is Awake");
    } catch (e) {
        console.log("[WARMER] AI Engine wake-up initiated...");
    }
};

// Ping every 8 minutes (Render sleeps after 15 mins)
if (process.env.PORT) {
    setInterval(keepAIWarm, 8 * 60 * 1000);
    setTimeout(keepAIWarm, 5000); // Trigger immediately on start
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const start = Date.now();
    let aiStatus = 'offline';
    let aiError = null;

    try {
        // Render cold start can take 30-40 seconds. 
        // We increase the timeout to 45s to ensure we don't call it 'offline' 
        // while it's still successfully waking up.
        console.log(`[HEALTH] Checking AI at ${AI_SERVICE_URL}...`);
        await axios.get(AI_SERVICE_URL, { timeout: 45000 });
        aiStatus = 'online';
    } catch (e) {
        // Log specifically what's happening
        aiError = e.response ? `HTTP ${e.response.status}` : e.message;

        // If it's a 502/503/timeout, it's booting
        // If it's a 404 or connection refused, it's misconfigured/dead
        if (e.response?.status === 502 || e.response?.status === 503 || e.code === 'ECONNABORTED') {
            aiStatus = 'booting';
        } else {
            aiStatus = 'offline';
        }
    }

    res.json({
        server: 'online',
        version: '1.2.5', // Track deployment
        ai: aiStatus,
        aiDetail: aiError,
        aiUrl: AI_SERVICE_URL,
        firebase: firebaseInitialized,
        latency: Date.now() - start
    });
});

// --- PERMANENT SOLUTION: BACKGROUND JOB POLLING SYSTEM ---
// This prevents the 30s connection timeout by using a 'Job ID' pattern.
const jobs = new Map();

// AI Prediction Route (Initiator)
app.post('/api/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const jobId = "job-" + Date.now() + Math.random().toString(36).substring(7);
        console.log(`[JOB] Starting ${jobId} for ${req.file.originalname}`);

        // Initialize job status
        jobs.set(jobId, { status: 'pending', result: null, error: null });

        // Run AI Analysis in the background so we can return the Job ID immediately
        (async () => {
            try {
                const maxRetries = 150; // Wait up to 5 minutes
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

                        console.log(`[JOB ${jobId}] Pinging AI Engine (Request Timeout: 30s)...`);
                        const aiRes = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
                            headers: formData.getHeaders(),
                            timeout: 30000
                        });

                        if (aiRes.data) {
                            aiResult = aiRes.data;
                            console.log(`[JOB ${jobId}] Engine Responded Successfully!`);
                            break;
                        }
                    } catch (e) {
                        // 502/503/504 or Socket Error means it's booting
                        const isBooting = !e.response || [502, 503, 504].includes(e.response.status) || e.code === 'ECONNABORTED';

                        if (!isBooting) {
                            console.error(`[JOB ${jobId}] AI Engine returned REAL error ${e.response?.status}`);
                            throw new Error(`AI Engine Error: ${e.response?.data?.error || e.message}`);
                        }

                        attempt++;
                        if (attempt % 5 === 0) console.log(`[JOB ${jobId}] Engine is waking up... (Attempt ${attempt}/${maxRetries})`);
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }

                if (!aiResult) throw new Error("AI Engine failed to start within 3 minutes. Please try again in a moment.");

                // Check for Not a Crop
                if (aiResult.disease === 'Not a Crop') {
                    jobs.set(jobId, { status: 'completed', result: { id: null, ...aiResult, imageUrl: null } });
                    return;
                }

                // Image Upload and Firestore logic
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
                    } catch (e) { console.log("Storage error:", e.message); }
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
                    } catch (e) { console.log("DB error:", e.message); }
                }

                jobs.set(jobId, { status: 'completed', result: { id: docId, ...aiResult, imageUrl } });
                console.log(`[JOB ${jobId}] COMPLETED`);

            } catch (err) {
                console.error(`[JOB ${jobId}] FAILED:`, err.message);
                jobs.set(jobId, { status: 'failed', error: err.message });
            }

            // Cleanup memory after 15 mins
            setTimeout(() => jobs.delete(jobId), 15 * 60 * 1000);
        })();

        res.json({ jobId, status: 'pending' });

    } catch (error) {
        console.error("Critical error in /api/detect:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Status check route
app.get('/api/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
});

// Weather Route Proxy
// Weather Route Proxy with Open-Meteo Fallback (No Key Needed)
app.get('/api/weather', async (req, res) => {
    let { lat, lon } = req.query;
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    // --- REFINED: IP-Based Location Detection & Fallback Name ---
    let ipCityName = null;
    try {
        const xForwardedFor = req.headers['x-forwarded-for'];
        const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.socket.remoteAddress;
        const ipRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city`);
        if (ipRes.data && ipRes.data.status === 'success') {
            ipCityName = ipRes.data.city;
            // Only overwrite coords if none provided
            if (!lat || !lon || lat === 'null' || lon === 'null' || lat === 'undefined' || lon === 'undefined') {
                lat = ipRes.data.lat;
                lon = ipRes.data.lon;
                console.log(`[WEATHER] Using IP Coords: ${lat}, ${lon}`);
            }
        }
    } catch (e) { console.log("[WEATHER] IP detection error:", e.message); }

    // Ultimate Fallback if everything fails
    if (!lat || !lon) {
        lat = 16.3067;
        lon = 80.4365;
    }

    // --- NEW: Granular Reverse Geocoding (High Precision with Retry) ---
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

                    // 1. Village Slot (Local)
                    const vName = a.village || a.hamlet || a.suburb || a.neighbourhood || a.residential || "";

                    // 2. Mandal Slot (Sub-District)
                    const mName = a.subdistrict || a.municipality || a.city_district || a.town || "";

                    // 3. District Slot (Administrative)
                    const dName = a.state_district || a.county || a.district || a.city || "";

                    const parts = [];
                    if (vName) parts.push(vName);

                    if (mName && !parts.some(p => p.toLowerCase() === mName.toLowerCase())) {
                        parts.push(mName);
                    }

                    if (dName && !parts.some(p => p.toLowerCase() === dName.toLowerCase())) {
                        parts.push(dName);
                    }

                    // Fallback to reach 3 parts while keeping Village-to-District order
                    if (parts.length < 3) {
                        const segments = a.display_name.split(',').map(s => s.trim());
                        for (const seg of segments) {
                            if (parts.length >= 3) break;
                            const broader = [a.state, a.country, a.postcode, "India"];
                            if (broader.some(b => b && b.toLowerCase() === seg.toLowerCase())) continue;

                            if (!parts.some(p => p.toLowerCase().includes(seg.toLowerCase()) || seg.toLowerCase().includes(p.toLowerCase()))) {
                                parts.push(seg);
                            }
                        }
                    }

                    locationName = parts.join(", ");
                    break;
                }
            } catch (e) {
                console.log(`[WEATHER] Reverse geo attempt ${attempt} failed:`, e.message);
                if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    if (API_KEY) {
        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
            const data = response.data;
            // Overwrite with granular name
            data.name = locationName;
            return res.json(data);
        } catch (error) {
            console.log("OpenWeatherMap failed, falling back to Open-Meteo...");
        }
    }

    // Fallback: Open-Meteo (Free, No Key)
    try {
        console.log(`Fetching weather for ${lat}, ${lon} from Open-Meteo`);
        const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);

        const data = response.data;
        const current = data.current;

        const weatherCodes = {
            0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Fog", 48: "Depositing rime fog",
            51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
            61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
            71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
            95: "Thunderstorm"
        };
        const weatherDesc = weatherCodes[current.weather_code] || "Variable";

        // Transform to OpenWeatherMap format for frontend compatibility
        const transformedData = {
            name: locationName,
            main: {
                temp: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                feels_like: current.apparent_temperature,
                temp_min: data.daily.temperature_2m_min[0],
                temp_max: data.daily.temperature_2m_max[0]
            },
            weather: [{
                main: weatherDesc,
                description: weatherDesc
            }],
            coord: { lat, lon }
        };

        res.json(transformedData);

    } catch (error) {
        console.error("All weather services failed:", error.message);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

// Regional Outbreaks API (Phase 8 of Plantix Workflow)
app.get('/api/outbreaks', async (req, res) => {
    try {
        let outbreaks = [];
        if (firebaseInitialized && db) {
            // Get last 14 days of data
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            const snapshot = await db.collection('predictions')
                .where('timestamp', '>=', fourteenDaysAgo)
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();

            const scans = [];
            snapshot.forEach(doc => scans.push(doc.data()));

            // Logic: Group by disease and rough location (1 decimal place = ~11km)
            const map = new Map();
            scans.forEach(s => {
                if (s.disease === 'Healthy' || s.disease === 'Not a Crop') return;
                const locKey = s.location?.lat ? `${s.location.lat.toFixed(1)},${s.location.lon.toFixed(1)}` : 'global';
                const key = `${s.disease}_${locKey}`;
                if (map.has(key)) {
                    map.get(key).count += 1;
                } else {
                    map.set(key, { disease: s.disease, crop: s.crop, count: 1, lat: s.location?.lat, lon: s.location?.lon });
                }
            });

            outbreaks = Array.from(map.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(o => ({
                    crop: o.crop || 'General',
                    disease: o.disease,
                    status: o.count > 5 ? 'Critical Outbreak' : o.count > 2 ? 'High Risk' : 'Monitoring',
                    color: o.count > 2 ? 'bg-red-500' : 'bg-orange-500',
                    trend: 'rising'
                }));
        }

        // Fallback: If no real outbreaks, show regional simulated data based on season
        if (outbreaks.length < 3) {
            const simulated = [
                { crop: 'Wheat', disease: 'Leaf Rust', status: 'Rising', color: 'bg-orange-500', trend: 'rising' },
                { crop: 'Cotton', disease: 'Bacterial Blight', status: 'Alert', color: 'bg-red-500', trend: 'stable' },
                { crop: 'Tomato', disease: 'Early Blight', status: 'Warning', color: 'bg-yellow-500', trend: 'rising' }
            ];
            outbreaks = [...outbreaks, ...simulated.slice(0, 4 - outbreaks.length)];
        }

        res.json(outbreaks);
    } catch (e) {
        console.error("Outbreak API failed:", e.message);
        res.status(500).json({ error: e.message });
    }
});



// History / Predictions Routes
app.get('/api/predictions', async (req, res) => {
    try {
        if (!firebaseInitialized || !db) {
            return res.json([]); // Return empty history in local mode
        }
        const snapshot = await db.collection('predictions').orderBy('timestamp', 'desc').get();
        const detections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(detections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/predictions/:id', async (req, res) => {
    try {
        if (!firebaseInitialized || !db) {
            return res.json({ success: true, localOnly: true });
        }
        await db.collection('predictions').doc(req.params.id).delete();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Community Routes
app.get('/api/community', async (req, res) => {
    try {
        if (!firebaseInitialized || !db) {
            return res.json([
                { id: 'c1', author: 'Team SmartCrop', content: 'Welcome to the Smart Crop Community! Share your farming journey here.', timestamp: new Date(), likes: 10, replies: 0 }
            ]);
        }
        const snapshot = await db.collection('posts').orderBy('timestamp', 'desc').get();
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/community', async (req, res) => {
    try {
        const post = {
            author: req.body.author || 'Anonymous',
            content: req.body.content,
            avatar: req.body.avatar || `https://i.pravatar.cc/150?u=${Math.random()}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            likes: 0,
            replies: 0
        };
        const docRef = await db.collection('posts').add(post);
        res.json({ id: docRef.id, ...post });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/community/:id', async (req, res) => {
    console.log(`[DELETE] Request for post ID: ${req.params.id}`);
    try {
        await db.collection('posts').doc(req.params.id).delete();
        console.log(`[DELETE] Success for ID: ${req.params.id}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`[DELETE] Error for ID: ${req.params.id}`, error);
        res.status(500).json({ error: error.message });
    }
});

// Like a post
app.post('/api/community/:id/like', async (req, res) => {
    try {
        if (!firebaseInitialized || !db) return res.json({ success: true });
        const postRef = db.collection('posts').doc(req.params.id);
        await postRef.update({
            likes: admin.firestore.FieldValue.increment(1)
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Comment on a post
app.post('/api/community/:id/comment', async (req, res) => {
    try {
        if (!firebaseInitialized || !db) return res.json({ success: true });
        const { text, author } = req.body;
        const postRef = db.collection('posts').doc(req.params.id);

        const commentData = {
            text,
            author: author || 'Anonymous',
            timestamp: new Date().toISOString()
        };

        await postRef.update({
            comments: admin.firestore.FieldValue.arrayUnion(commentData),
            replies: admin.firestore.FieldValue.increment(1)
        });

        res.json({ success: true, comment: commentData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Live Mandi Prices Route
app.get('/api/mandi', (req, res) => {
    // Realistic Market Mapping
    const stateMarkets = {
        "Andhra Pradesh": ["Guntur", "Adoni", "Kurnool", "Vijayawada", "Anakapalle", "Tenali"],
        "Telangana": ["Nizamabad", "Warangal", "Khammam", "Siddipet", "Mehboobnagar", "Badepally"],
        "Karnataka": ["Raichur", "Hubli", "Bellary", "Shimoga", "Bagalkot", "Davangere"],
        "Maharashtra": ["Pune", "Nashik", "Latur", "Solapur", "Akola", "Nagpur"],
        "Punjab": ["Khanna", "Rajpura", "Patiala", "Abohar", "Ludhiana", "Moga"],
        "Uttar Pradesh": ["Kanpur", "Agra", "Bareilly", "Hardoi", "Mainpuri", "Hathras"],
        "Madhya Pradesh": ["Indore", "Ujjain", "Mandsaur", "Khandwa", "Dewas", "Neemuch"],
        "Tamil Nadu": ["Erode", "Salem", "Dindigul", "Theni", "Villupuram", "Coimbatore"],
        "Gujarat": ["Unjha", "Gondal", "Rajkot", "Amreli", "Dahod", "Patan"],
        "Haryana": ["Sirsa", "Ellenabad", "Karnal", "Jind", "Hisar", "Rohtak"]
    };

    const crops = [
        { name: "Paddy (Dhan)", basePrice: 2200 },
        { name: "Wheat", basePrice: 2150 },
        { name: "Cotton", basePrice: 6800 },
        { name: "Maize", basePrice: 1960 },
        { name: "Tomato", basePrice: 2500 },
        { name: "Onion", basePrice: 1800 },
        { name: "Potato", basePrice: 1200 },
        { name: "Chilli", basePrice: 12500 },
        { name: "Turmeric", basePrice: 7500 },
        { name: "Groundnut", basePrice: 5800 },
        { name: "Soybean", basePrice: 4200 },
        { name: "Mustard", basePrice: 5400 }
    ];

    const marketData = [];
    const timestamp = new Date().toISOString();

    Object.keys(stateMarkets).forEach(state => {
        const markets = stateMarkets[state];
        // Pick random markets from the list
        markets.forEach(marketName => {
            // Randomly decide if this market reports data today (80% chance)
            if (Math.random() > 0.2) {
                // Each market reports random crops
                crops.forEach(crop => {
                    if (Math.random() > 0.6) { // 40% chance crop exists in this market
                        // Fluctuation +/- 10%
                        const fluctuation = (Math.random() * 0.2) - 0.1;
                        const price = Math.round(crop.basePrice * (1 + fluctuation));

                        marketData.push({
                            state: state,
                            district: marketName, // Using market name as district/city proxy for simplicity
                            market: marketName + " Mandi",
                            commodity: crop.name,
                            min_price: price - (50 + Math.floor(Math.random() * 200)),
                            max_price: price + (50 + Math.floor(Math.random() * 200)),
                            modal_price: price,
                            arrival_date: timestamp
                        });
                    }
                });
            }
        });
    });

    res.json({
        total: marketData.length,
        updated_at: timestamp,
        data: marketData
    });
});

// Agri-Marketplace Routes
app.get('/api/shops', (req, res) => {
    const shops = [
        {
            id: "shop-001",
            name: "Krishi Seva Kendra",
            owner: "Rajesh Patel",
            distance: "1.2 km",
            rating: 4.9,
            tags: ["Certified Seeds", "Expert Advice"],
            image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=400",
            verified: true,
            status: "Open Now",
            phone: "+91 98765 43210"
        },
        {
            id: "shop-002",
            name: "Modern Farmer's Hub",
            owner: "Dr. Ananya Reddy",
            distance: "3.5 km",
            rating: 4.7,
            tags: ["NPK Specialized", "Smart Tools"],
            image: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&q=80&w=400",
            verified: true,
            status: "Fast Moving",
            phone: "+91 87654 32109"
        },
        {
            id: "shop-003",
            name: "Apex Agri Solutions",
            owner: "Vikram Shah",
            distance: "6.8 km",
            rating: 4.4,
            tags: ["Bulk Fertilizers", "Pumps"],
            image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=400",
            verified: true,
            status: "High Stock",
            phone: "+91 76543 21098"
        }
    ];
    res.json(shops);
});

app.get('/api/products', (req, res) => {
    const products = [
        { id: "p-001", name: "Micro-Nutrient Urea", price: "₹266", unit: "45kg Bag", img: "📦", stock: "In Stock", color: "from-emerald-500 to-green-600" },
        { id: "p-002", name: "Hybrid Paddy V2", price: "₹850", unit: "10kg", img: "🌾", stock: "High Demand", color: "from-amber-500 to-orange-600" },
        { id: "p-003", name: "Super Potash MOP", price: "₹1,700", unit: "50kg Bag", img: "🧱", stock: "Limited", color: "from-indigo-500 to-blue-600" },
        { id: "p-004", name: "Bio-Neem Power", price: "₹450", unit: "1 Liter", img: "🧴", stock: "In Stock", color: "from-rose-500 to-pink-600" }
    ];
    res.json(products);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
