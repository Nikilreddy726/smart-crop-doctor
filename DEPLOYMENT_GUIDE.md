# 🚀 Pin-to-Pin Deployment Guide: Smart Crop Doctor

This is a comprehensive, step-by-step guide to deploying your "Smart Crop Doctor" application. We will deploy the **three** distinct parts of your application:
1.  **AI Service (Python)** -> On **Render** (Free Tier)
2.  **Backend Server (Node.js)** -> On **Render** (Free Tier)
3.  **Frontend Client (React/Vite)** -> On **Vercel** (Free & Fast)

---

## �️ Prerequisites
Before starting, ensure you have the following:
1.  **GitHub Account**: [Sign up here](https://github.com/join).
2.  **Render Account**: [Sign up here](https://render.com/).
3.  **Vercel Account**: [Sign up here](https://vercel.com/signup).
4.  **Git Installed**: Run `git --version` to check.
5.  **Firebase Project**: You should already have access to your Firebase Console.

---

## 📂 Phase 1: Prepare Your Code (GitHub)

We need to put your local code onto GitHub so deploying services can access it.

1.  **Open Temporary Terminal** in your project root (`c:\Users\reddy\OneDrive\Desktop\crop`).
2.  **Initialize Git** (if not done):
    ```bash
    git init
    ```
3.  **Create `.gitignore` File**:
    Ensure you have a `.gitignore` file in the root directory with the following content (to avoid uploading huge folders or secrets):
    ```text
    node_modules/
    .venv/
    __pycache__/
    dist/
    .env
    server/serviceAccountKey.json
    ```
4.  **Commit Your Code**:
    ```bash
    git add .
    git commit -m "Ready for deployment"
    ```
5.  **Push to GitHub**:
    *   Go to [GitHub.com](https://github.com/new) and create a new repository named `smart-crop-doctor`.
    *   **Do not** initialize with README/license (keep it empty).
    *   Copy the commands shown under "…or push an existing repository from the command line" and run them in your terminal:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/smart-crop-doctor.git
    git branch -M main
    git push -u origin main
    ```

---

## 🧠 Phase 2: Deploy AI Service (Python) on Render

This service runs the image detection logic.

1.  Log in to your **[Render Dashboard](https://dashboard.render.com/)**.
2.  Click **"New +"** -> **"Web Service"**.
3.  Select **"Build and deploy from a Git repository"** and click **Next**.
4.  Connect your GitHub account and select the `smart-crop-doctor` repo.
5.  **Configure the Service**:
    *   **Name**: `crop-ai-service`
    *   **Region**: Singapore (or nearest to you).
    *   **Branch**: `main`
    *   **Root Directory**: `ai-service` (Important!)
    *   **Runtime**: **Python 3**
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
    *   **Instance Type**: Free
6.  Click **Creates Web Service**.
7.  **Wait**: It will take a few minutes. Once "Live", copy the URL (e.g., `https://crop-ai-service.onrender.com`).
    *   *Save this URL, we need it for Phase 3.*

---

## ⚙️ Phase 3: Deploy Backend (Node.js) on Render

This runs your API, connects to Firebase, and talks to the AI service.

1.  On Render Dashboard, click **Change** (top left) -> **New Web Service**.
2.  Select the same `smart-crop-doctor` repo.
3.  **Configure the Service**:
    *   **Name**: `crop-backend`
    *   **Root Directory**: `server` (Important!)
    *   **Runtime**: **Node**
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
    *   **Instance Type**: Free
4.  **Environment Variables** (Scroll down to "Advanced"):
    *   Click **Add Environment Variable**.
    *   **Key**: `AI_SERVICE_URL`
    *   **Value**: `https://crop-ai-service.onrender.com` (The URL from Phase 2).
    *   **Key**: `FIREBASE_SERVICE_ACCOUNT`
    *   **Value**: *Open your `server/serviceAccountKey.json` file locally, copy the WHOLE content, and paste it here.*
5.  Click **Create Web Service**.
6.  **Wait**: Once live, copy the URL (e.g., `https://crop-backend.onrender.com`).
    *   *Save this URL, we need it for Phase 4.*

---

## 🎨 Phase 4: Prepare Frontend for Production

We need to tell your frontend to talk to the live backend, not localhost.

1.  **Go to your code** (`client/src/services/api.js`).
2.  Find the line defining `API_URL`.
3.  **Update it**:
    ```javascript
    // Use an environment variable for flexibility
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    ```
    *(If your code doesn't look like this, simply ensure it uses `import.meta.env.VITE_API_URL`)*.
4.  **Verify `CLIENT_URL` in Backend**:
    *   In `server/index.js`, ensure CORS allows your future Vercel domain. To be safe for now, allow all:
    ```javascript
    app.use(cors({ origin: "*" }));
    ```
5.  **Commit these small changes**:
    ```bash
    git add .
    git commit -m "Config for production"
    git push
    ```

---

## 🌐 Phase 5: Deploy Frontend on Vercel

Vercel is the easiest way to host React/Vite apps.

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import from **GitHub**. Select `smart-crop-doctor`.
4.  **Configure Project**:
    *   **Framework Preset**: Vite (Automatic)
    *   **Root Directory**: Click "Edit" and select `client`. (Crucial!)
5.  **Environment Variables**:
    *   Expand the section.
    *   **Key**: `VITE_API_URL`
    *   **Value**: `https://crop-backend.onrender.com/api` (The URL from Phase 3. **Note**: Add `/api` at the end if your routes need it, typically just the base URL).
6.  Click **Deploy**.
7.  **Wait**: You will see a "Congratulations!" screen.
8.  **Test**: Click the preview image to open your live site!

---

## ✅ Phase 6: Final Verification

1.  **Open your Vercel URL** on your phone or laptop.
2.  **Test Authentication**: Login with Google or Email.
3.  **Test Detection**: Upload a crop image.
    *   The Frontend sends image -> Backend (Render) -> AI Service (Render).
    *   AI Service replies -> Backend -> Frontend.
4.  **Check History**: Ensure the result is saved.

### ⚠️ Troubleshooting Common Issues

*   **"Network Error" or 500 Error**:
    *   Check your `VITE_API_URL` in Vercel. Did you forget `/api`?
    *   Check Backend logs on Render. Is the `FIREBASE_SERVICE_ACCOUNT` JSON correct?
*   **Image Upload Fails**:
    *   Check AI Service logs on Render. Is it Crashing? (Memory limits on free tier are tight).
*   **CORS Error**:
    *   Ensure Backend `index.js` has `app.use(cors({ origin: "*" }))` or specifically lists your Vercel domain.

---

**🎉 Congratulations! You have successfully deployed a Full Stack AI Application.**

