# 🌾 Smart Crop Doctor - Complete Project Guide

## 1. Executive Summary
**Smart Crop Doctor** is a comprehensive, full-stack agricultural platform designed to empower farmers with AI-driven insights. It serves as a one-stop ecosystem for crop disease detection, market analysis, weather forecasting, and community collaboration. By leveraging deep learning and modern web technologies, the platform bridges the gap between advanced technology and traditional farming, ensuring accurate diagnosis (Healthy/Diseased), detailed treatment plans, and timely market information.

**Mission:** *Protecting Crops, Empowering Farmers.*

---

## 2. Key Features

### 🤖 AI Disease Detection
- **Instant Diagnosis:** Detects diseases like *Blight, Mildew, Rust, Mosaic Virus* with >95% accuracy.
- **Robust Validation:** Smart AI rejects non-crop images (diagrams, selfies, random objects) to ensure data integrity.
- **Detailed Reports:** Provides severity levels (High/Medium/Low), confidence scores, and step-by-step recovery plans (Chemical & Organic).

### 🌍 Multi-Language Support
Native support for **6 Regional Languages**, ensuring accessibility for farmers across India:
- English, Hindi (हिंदी), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Malayalam (മലയാളം).

### 📊 Detection History & Analytics
- **Secure Cloud Storage:** All scans are saved to the user's secure history.
- **Smart Dashboard:** Visualizes crop health trends over time.
- **Export:** Users can review past reports and export summaries.

### 🌤️ Agricultural Utilities
- **Live Weather:** Hyper-local real-time forecasts (Temperature, Humidity, Wind, Rain).
- **Mandi Prices:** Live market rates for various crops (Paddy, Wheat, Tomato, etc.) across different Indian states.
- **Government Schemes:** Information directory for central and state agricultural schemes, including eligibility and benefits.

### 👥 "All India" Community Forum
- ** Discussion Platform:** A Facebook-style forum for farmers to ask questions and share knowledge.
- **Features:** Creating posts, liking, commenting, and filtering by region or solution.
- **Moderation:** Secure environment with user management.

---

## 3. Technology Stack & Architecture

The application follows a modern **Microservices Architecture**:

### 🖥️ Frontend (Client)
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS, Framer Motion (Animations)
- **State Management:** React Context API (Auth, Language)
- **Hosting:** Firebase Hosting (CDN)

### ⚙️ Backend (Orchestrator)
- **Runtime:** Node.js (Express)
- **Database:** Firebase Firestore (NoSQL)
- **Storage:** Firebase Cloud Storage (Images)
- **Auth:** Firebase Authentication
- **Hosting:** Render (Node.js Service)

### 🧠 AI Service (Intelligence)
- **Runtime:** Python (FastAPI)
- **Logic:** Custom Color & Texture Analysis Algorithms, Deep Learning models (TensorFlow/PyTorch)
- **Hosting:** Render (Python Service)

---

## 4. Local Development Setup

Follow these steps to run the project locally on your machine.

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- Git

### Step 1: Clone Repository
```bash
git clone https://github.com/Nikilreddy726/smart-crop-doctor.git
cd smart-crop-doctor
```

### Step 2: Backend Setup
```bash
cd server
npm install
# Ensure you have .env or serviceAccountKey.json for Firebase Admin
node index.js
```
*Server runs on port 5000*

### Step 3: AI Service Setup
```bash
cd ai-service
python -m venv venv
# Activate venv: source venv/bin/activate (Mac/Linux) or venv\Scripts\activate (Windows)
pip install -r requirements.txt
uvicorn main:app --reload
```
*AI Service runs on port 8000*

### Step 4: Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Client runs on port 5173*

---

## 5. Deployment Guide

This section outlines how to deploy the three distinct parts of the application.

### Phase 1: AI Service (Python) on Render
1.  Push code to GitHub.
2.  Create a **New Web Service** on Render.
3.  Select repo and set Root Directory to `ai-service`.
4.  **Build Command:** `pip install -r requirements.txt`
5.  **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Phase 2: Backend (Node.js) on Render
1.  Create a **New Web Service** on Render.
2.  Select repo and set Root Directory to `server`.
3.  **Build Command:** `npm install`
4.  **Start Command:** `node index.js`
5.  **Environment Variables:** Add `AI_SERVICE_URL` (from Phase 1) and `FIREBASE_SERVICE_ACCOUNT` (JSON content).

### Phase 3: Frontend on Firebase Hosting
*(Note: Can also be deployed on Vercel, but Firebase is recommended for deep integration).*
1.  Install Firebase CLI: `npm install -g firebase-tools`
2.  Login: `firebase login`
3.  Initialize: `firebase init` (Select Hosting).
4.  **Build:** Run `npm run build` in the `client` folder.
5.  **Deploy:** Run `firebase deploy`.

---

## 6. Current Deployment Status (Report)

**Date:** December 28, 2025
**Status:** ✅ Live & Operational

| Component | URL / Endpoint | Hosting Provider | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Application** | **[https://smart-doctor-crop.web.app](https://smart-doctor-crop.web.app)** | Firebase Hosting | 🟢 Online |
| **Backend API** | `https://crop-backend-avko.onrender.com` | Render (Node.js) | 🟢 Online |
| **AI Analysis Service** | `https://crop-ai-service.onrender.com` | Render (Python) | 🟢 Online |

---

## 7. Future Roadmap
- **IoT Integration:** Connecting soil sensors for real-time moisture data.
- **Marketplace:** E-commerce section for buying fertilizers and seeds directly.
- **Drone Support:** Integration for analyzing large-scale field scans.

---

## 📞 Contact
**Project Lead:** Nikil Reddy
**Email:** nikilreddy726@gmail.com
**GitHub:** [Nikilreddy726](https://github.com/Nikilreddy726)

*Built with ❤️ for Indian Farmers*
