# ⚡ 24/7 Uptime Guide - Smart Crop Doctor

Since we are using the **Render Free Tier**, the server and AI engine will automatically "sleep" after 15 minutes of inactivity. To keep them **Always On** so you never see "Warming Up" again, follow these steps to set up a free external "Heartbeat."

---

## 🚀 Step-by-Step Instructions

We will use a free service called **Cron-job.org** to ping your website every 10 minutes. This tricks Render into thinking someone is always using the site.

### 1. Create a Free Account
- Go to [https://cron-job.org](https://cron-job.org)
- Sign up for a free account and verify your email.

### 2. Create the First Cron-Job (For Backend)
- Click **"Create Cronjob"** in your dashboard.
- **Title:** `Crop Backend Heartbeat`
- **URL:** `https://crop-backend-avko.onrender.com/api/health`
- **Execution Schedule:** Select **"Every 10 minutes"**.
- **Click Create.**

### 3. Create the Second Cron-Job (For AI Engine)
- Click **"Create Cronjob"** again.
- **Title:** `Crop AI Engine Heartbeat`
- **URL:** `https://smart-crop-doctor.onrender.com/`
- **Execution Schedule:** Select **"Every 10 minutes"**.
- **Click Create.**

---

## ✅ Why this works
- **Render's Rule:** Sleep if inactive for 15 minutes.
- **Our Solution:** We ping it every 10 minutes from the outside.
- **Result:** The server never gets 15 minutes of quiet time, so it **never sleeps**.

## 📊 Verification
Once you set these up, wait about 15 minutes. Then:
1. Open your website.
2. The engine light should be **Green (Online)** immediately, every single time. 

If it ever says "Warming Up" again, check your Cron-job.org dashboard to ensure the jobs are "Succeeded."

---
*Built with ❤️ to keep the Crop Doctor ready for farmers at any hour.*
