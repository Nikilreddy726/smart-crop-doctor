# 🚀 Deployment Guide for Smart Crop Doctor

This guide will help you deploy your full-stack application for free using **Firebase Hosting** (Frontend) and **Render** (Backend & AI Service).

## 📋 Prerequisites
1.  **GitHub Account**: You need to push your code to a GitHub repository.
2.  **Render Account**: Sign up at [render.com](https://render.com/).
3.  **Firebase CLI**: Installed on your machine.

---

## 1️⃣ Step 1: Push Code to GitHub
Committing your code is the first step.
1.  Open a new terminal.
2.  Initialize Git and ignore secrets:
    ```bash
    git init
    echo "node_modules/" >> .gitignore
    echo ".venv/" >> .gitignore
    echo "server/serviceAccountKey.json" >> .gitignore
    echo ".env" >> .gitignore
    ```
3.  Commit and Push:
    ```bash
    git add .
    git commit -m "Initial commit"
    # Create a repo on GitHub.com and follow the instructions to 'git remote add origin ...' and 'git push'
    ```

---

## 2️⃣ Step 2: Deploy Frontend (Firebase Hosting)
Since you use Firebase for Auth/DB, hosting the frontend there is seamless.

1.  **Install Firebase Tools** (if not installed):
    ```bash
    npm install -g firebase-tools
    ```
2.  **Login & Init**:
    ```bash
    firebase login
    firebase init hosting
    ```
    *   **Select Project**: Use an existing project -> `smart-doctor-crop`.
    *   **Public Directory**: Type `client/dist`.
    *   **Single Page App**: Yes (`y`).
    *   **GitHub Deploys**: No (`n`) for now.
3.  **Build & Deploy**:
    ```bash
    cd client
    npm run build
    cd ..
    firebase deploy --only hosting
    ```
    *   **Result**: You will get a URL like `https://smart-doctor-crop.web.app`.

---

## 3️⃣ Step 3: Deploy AI Service (Python)
We will use **Render** for the Python service.

1.  **New Web Service** on Render dashboard.
2.  **Connect GitHub**: Select your repository.
3.  **Settings**:
    *   **Name**: `crop-ai-service`
    *   **Root Directory**: `ai-service`
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4.  **Create Web Service**.
5.  **Copy URL**: Once live, copy the URL (e.g., `https://crop-ai-service.onrender.com`).

---

## 4️⃣ Step 4: Deploy Backend (Node.js)
We will use **Render** for the Node.js server too.

1.  **New Web Service** on Render.
2.  **Connect GitHub**: Select your repository.
3.  **Settings**:
    *   **Name**: `crop-backend`
    *   **Root Directory**: `server`
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
4.  **Environment Variables** (Advanced):
    *   You need to add your Firebase Secret Key here.
    *   Key: `FIREBASE_SERVICE_ACCOUNT`
    *   Value: (Paste the entire content of `server/serviceAccountKey.json` here).
    *   Key: `OPENWEATHER_API_KEY` (if you have one).
5.  **Create Web Service**.
6.  **Copy URL**: Once live, copy the URL (e.g., `https://crop-backend.onrender.com`).

---

## 5️⃣ Final Step: Connect Them
Now that you have live URLs, you need to update them in your code so they talk to each other.

1.  **Update Frontend (`client/src/services/api.js`)**:
    *   Change `http://localhost:5000` to your **Node Backend URL**.
2.  **Update Backend (`server/index.js`)**:
    *   Change `http://localhost:8000` to your **Python AI Service URL**.
3.  **Re-deploy**:
    *   Frontend: `npm run build` -> `firebase deploy`.
    *   Backend: Commit and Push changes to GitHub (Render auto-updates).

🚀 **Your app is now live!**
