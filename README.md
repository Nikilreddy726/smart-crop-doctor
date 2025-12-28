# 🌾 Smart Crop Doctor - AI-Powered Agriculture Assistant
### *Protecting Crops, Empowering Farmers.*



## 🚀 Overview
**Smart Crop Doctor** is a comprehensive, full-stack web application designed to revolutionize how farmers diagnose and treat plant diseases. Leveraging advanced **Deep Learning (AI)**, it allows users to simply upload a photo of a crop leaf and instantly receive a diagnosis (Healthy/Diseased), severity score, and detailed treatment recommendations (Chemical, Organic, and Preventive).

Beyond detection, it serves as a complete ecosystem for farmers, offering real-time weather updates, government scheme information, market prices (Mandi), and a community forum for expert advice—available in **6 Indian Languages**.

---

## ✨ Key Features

### 🤖 1. AI Disease Detection
*   **Instant Diagnosis**: Detects diseases like *Blight, Mildew, Rust, Mosaic Virus, and more* with >95% accuracy.
*   **Robust Validation**: Smart AI rejects non-crop images (diagrams, selfies, random objects) to ensure data integrity.
*   **Detailed Reports**: Provides severity levels (High/Medium/Low), confidence scores, and step-by-step recovery plans.

### 🌍 2. Multilingual Support
*   Native support for **6 Regional Languages**:
    *   🇺🇸 English
    *   🇮🇳 Hindi (हिंदी)
    *   🇮🇳 Telugu (తెలుగు)
    *   🇮🇳 Kannada (ಕನ್ನಡ)
    *   🇮🇳 Tamil (தமிழ்)
    *   🇮🇳 Malayalam (മലയാളം)

### 📊 3. Detection History & Analytics
*   **Secure Cloud Storage**: All scans are saved to the user's secure history.
*   **Sync & Export**: Users can review past reports and export summaries.
*   **Smart Dashboard**: Visualizes crop health trends over time.

### 🌤️ 4. Agricultural Utilities
*   **Live Weather**: Real-time forecasts (Temperature, Humidity, Wind, Rain) to plan farming activities.
*   **Mandi Prices**: Live market rates for various crops across different Indian states.
*   **Government Schemes**: Information on the latest subsidies and financial aid for farmers.

### 👥 5. Community Forum
*   **"All India Community"**: A platform for farmers to ask questions, share knowledge, and get expert solutions.

---



## 🛠️ Technology Stack

### **Frontend (Client)**
*   **Framework**: React.js (Vite)
*   **Styling**: Tailwind CSS, Framer Motion (Animations)
*   **Icons**: Lucide React
*   **Charts**: Chart.js

### **Backend (Server)**
*   **Runtime**: Node.js (Express)
*   **Database**: Firebase Firestore (NoSQL)
*   **Storage**: Firebase Cloud Storage
*   **Auth**: Firebase Authentication (Email/Password + Phone)

### **AI Service**
*   **Framework**: Python (FastAPI)
*   **Libraries**: Pillow (Image Processing), NumPy (Analysis)
*   **Logic**: Custom Heuristic Color & Texture Analysis Algorithms

---

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-crop-doctor.git
cd smart-crop-doctor
```

### 2. Setup Backend (Node.js)
```bash
cd server
npm install
# Create a .env file with your Firebase Admin credentials or place serviceAccountKey.json
node index.js
```
*Server runs on port 5000*

### 3. Setup AI Service (Python)
```bash
cd ai-service
# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi uvicorn pillow numpy python-multipart
uvicorn main:app --reload
```
*AI Service runs on port 8000*

### 4. Setup Frontend (React)
```bash
cd client
npm install
npm run dev
```
*Client runs on port 5173*

---

## 🌐 Deployment

The application is fully deployed and live:

*   **Frontend**: Hosted on [Firebase Hosting](https://smart-doctor-crop.web.app)
*   **Backend & AI**: Hosted on [Render](https://render.com)

---

## 🤝 Contribution
Contributions are welcome!
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📞 Contact
**Project Lead**: Nikil Reddy
**Email**: nikilreddy726@gmail.com
**GitHub**: [Nikilreddy726](https://github.com/Nikilreddy726)

---
*Built with ❤️ for Indian Farmers*
