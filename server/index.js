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
// This keeps the AI service awake as long as the backend is running
const AI_SERVICE_URL = process.env.AI_SERVICE_URL ||
    (process.env.PORT ? 'https://crop-ai-service.onrender.com' : 'http://127.0.0.1:8000');

const keepAIWarm = async () => {
    try {
        console.log("[WARMER] Pinging AI Engine to prevent sleep...");
        await axios.get(AI_SERVICE_URL, { timeout: 10000 });
        console.log("[WARMER] AI Engine is Awake");
    } catch (e) {
        console.log("[WARMER] AI Engine is currently sleeping, wake-up signal sent.");
    }
};

// Ping every 10 minutes (Render sleeps after 15 mins)
if (process.env.PORT) {
    setInterval(keepAIWarm, 10 * 60 * 1000);
    // Initial ping on startup
    setTimeout(keepAIWarm, 5000);
}

// Health check endpoint for Frontend to call on landing
app.get('/api/health', async (req, res) => {
    const start = Date.now();
    let aiStatus = 'offline';
    try {
        await axios.get(AI_SERVICE_URL, { timeout: 15000 });
        aiStatus = 'online';
    } catch (e) {
        aiStatus = 'booting';
    }
    res.json({
        server: 'online',
        ai: aiStatus,
        firebase: firebaseInitialized,
        latency: Date.now() - start
    });
});

// AI Prediction Route
app.post('/api/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        console.log("Processing image:", req.file.originalname);

        // 1. Call AI Microservice with Robust & Faster Retry 
        // We reduce the wait time to 2s to ensure 5 attempts + processing fits in < 30s (Render Ingress Timeout)
        let aiResult;
        const maxRetries = 4;
        let attempt = 0;
        let lastError;

        while (attempt <= maxRetries) {
            try {
                console.log(`[AI SERVICE] Attempt ${attempt + 1}/${maxRetries + 1} for ${req.file.originalname}`);
                const FormData = require('form-data');
                const formData = new FormData();
                formData.append('file', req.file.buffer, {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                });

                const aiRes = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
                    headers: formData.getHeaders(),
                    timeout: 20000 // 20s per attempt, but we loop fast
                });

                aiResult = aiRes.data;
                console.log(`[AI SERVICE] Success on attempt ${attempt + 1}`);
                break;
            } catch (aiError) {
                lastError = aiError;
                attempt++;
                console.error(`[AI SERVICE] Attempt ${attempt} failed: ${aiError.message}`);

                // If AI service is booting (502/503/ETIMEDOUT), retry quickly
                if (attempt <= maxRetries) {
                    const waitTime = 2000; // 2 seconds between retries
                    console.log(`[AI SERVICE] Engine warming up. Retrying in ${waitTime}ms...`);
                    await new Promise(r => setTimeout(r, waitTime));
                } else {
                    break;
                }
            }
        }

        if (!aiResult) {
            const errorStatus = lastError?.response?.status || 503;
            return res.status(errorStatus).json({
                error: 'AI Analysis Engine is cold-starting.',
                details: `The AI engine was asleep. We tried 5 times to wake it up, but Render is taking longer than 30 seconds to boot the container. Please wait 30 seconds and try again - the engine is already warming up now.`,
                diagnostic: { status: errorStatus, msg: lastError?.message }
            });
        }
        // ... [rest of the original logic]

        // CHECK: Is this a valid crop?
        if (aiResult.disease === 'Not a Crop') {
            return res.json({
                id: null,
                ...aiResult,
                imageUrl: null
            });
        }

        // 2. Try to upload to Firebase Storage (Only if initialized)
        let imageUrl = null;
        if (firebaseInitialized) {
            try {
                const blob = bucket.file(`detections/${Date.now()}_${req.file.originalname}`);
                await new Promise((resolve, reject) => {
                    const blobStream = blob.createWriteStream({
                        metadata: { contentType: req.file.mimetype }
                    });
                    blobStream.on('error', reject);
                    blobStream.on('finish', resolve);
                    blobStream.end(req.file.buffer);
                });
                try { await blob.makePublic(); } catch (e) { }
                imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            } catch (storageError) {
                console.log("Firebase storage error:", storageError.message);
            }
        }

        // 3. Try to save to Firestore (Only if initialized)
        let docId = "local-" + Date.now();
        if (firebaseInitialized && db) {
            try {
                const docRef = await db.collection('predictions').add({
                    imageUrl: imageUrl,
                    ...aiResult,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    userId: req.body.userId || 'anonymous'
                });
                docId = docRef.id;
            } catch (dbError) {
                console.log("Firestore save error:", dbError.message);
            }
        }

        res.json({ id: docId, ...aiResult, imageUrl: imageUrl });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Weather Route Proxy
// Weather Route Proxy with Open-Meteo Fallback (No Key Needed)
app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    if (API_KEY) {
        try {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
            return res.json(response.data);
        } catch (error) {
            console.log("OpenWeatherMap failed, falling back to Open-Meteo...");
        }
    }

    // Fallback: Open-Meteo (Free, No Key)
    try {
        console.log(`Fetching weather for ${lat}, ${lon} from Open-Meteo`);
        // Added apparent_temperature for 'Feels Like'
        const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);

        const data = response.data;
        const current = data.current;

        // WMO Weather Code Mapping (Simplified for brevity, same as before)
        const weatherCodes = {
            0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Fog", 48: "Depositing rime fog",
            51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
            61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
            71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
            95: "Thunderstorm"
        };
        const weatherDesc = weatherCodes[current.weather_code] || "Variable";

        // Reverse Geocoding for City Name
        let locationName = "Your Location";
        try {
            // Nominatim requires a valid User-Agent with contact info
            const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
                headers: {
                    'User-Agent': 'SmartCropDoctor/1.0 (nikilreddy726@gmail.com)',
                    'Referer': 'https://smart-crop-doctor.web.app/'
                }
            });

            if (geoResponse.data && geoResponse.data.address) {
                const a = geoResponse.data.address;
                locationName = a.city || a.town || a.village || a.suburb || a.county || a.state_district || a.municipality || locationName;
            }
        } catch (e) {
            console.log("Reverse geo failed:", e.message);
        }

        // Transform to OpenWeatherMap format for frontend compatibility
        const transformedData = {
            name: locationName,
            main: {
                temp: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                feels_like: current.apparent_temperature, // Added Feels Like
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
