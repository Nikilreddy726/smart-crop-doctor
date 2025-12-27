# Smart Crop Doctor - Project Documentation

## 1. Executive Summary
**Smart Crop Doctor** is a comprehensive agricultural platform designed to empower farmers with AI-driven insights. It serves as a one-stop solution for crop disease detection, market analysis, weather forecasting, and community collaboration. The platform aims to bridge the gap between technology and traditional farming, ensuring accurate diagnosis and timely information.

## 2. Technology Stack

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS (Modern, Responsive Design)
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **State Management:** React Context API (AuthContext, LanguageContext)
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth
- **AI Integration:** Google Gemini AI (for crop disease analysis)

## 3. Key Features

### 3.1 AI Crop Disease Detection
- **Functionality:** Users can upload or capture photos of crop leaves.
- **Process:** The image is sent to the backend where it is analyzed using Advanced AI.
- **Output:** Detailed diagnosis including disease name, confidence score, symptoms, and recommended treatments (biological and chemical).

### 3.2 Live Mandi Prices
- **Functionality:** Real-time tracking of agricultural market rates.
- **Data:** categorized by crop types (Paddy, Wheat, etc.) and states.
- **Visuals:** Trend indicators (Rising, Falling, Stable) to help farmers make selling decisions.

### 3.3 Community Forum
- **Functionality:** A "Facebook-style" discussion platform for farmers.
- **Features:** 
    - Create posts (Questions, Suggestions).
    - Like and Comment on posts.
    - Regional filtering (All India, Solutions, My Region).
    - Profile badges (Initials with dynamic colors).
- **Security:** Moderated environment with delete capabilities.

### 3.4 Multi-Language Support
- **Languages:** English, Hindi (हिंदी), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Malayalam (മലയാളം).
- **Implementation:** Full localization of UI, including dynamic content and navigation.

### 3.5 Weather & Forecasting
- **Functionality:** Hyper-local weather updates.
- **Data:** Temperature, Humidity, Wind Speed, and Precipitation forecasts to aid planting schedules.

### 3.6 Government Schemes
- **Functionality:** Information directory for central and state agricultural schemes.
- **Details:** Eligibility criteria, benefits, and required documents.

## 4. System Architecture

### 4.1 Client-Side (Frontend)
- **Pages:**
    - `Detect.jsx`: Main interface for image analysis.
    - `Community.jsx`: Social features and discussions.
    - `MandiPrices.jsx`: Market rate display.
    - `Dashboard.jsx`: User overview and health stats.
- **Services:**
    - `api.js`: Centralized API calls.
    - `firebase.js`: Firebase configuration.

### 4.2 Server-Side (Backend)
- **Endpoints:**
    - `POST /api/detect`: Handles image processing and AI request.
    - `GET /api/posts`: Fetches community discussions.
    - `POST /api/community/:id/like`: Handles post engagement.
    - `POST /api/community/:id/comment`: Handles post replies.

## 5. Setup & Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Steps
1. **Clone Repository:**
   ```bash
   git clone [repo-url]
   cd crop
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   node index.js
   ```

3. **Frontend Setup:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Access:**
   Open `http://localhost:5173` in your browser.

## 6. Future Roadmap
- Integration of IoT sensor data.
- E-commerce marketplace for fertilizers and seeds.
- Drone integration for large-scale field scanning.

