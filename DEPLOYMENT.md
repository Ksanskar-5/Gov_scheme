# 🚀 Deployment Guide: Vercel + Render + Supabase

Deploy the **Bharat Scheme Guide** application using:
- **Vercel** - React frontend (free)
- **Render** - Node.js backend (free tier)
- **Supabase** - PostgreSQL database (free tier)

---

## 📋 Prerequisites

1. ✅ **GitHub account** - [github.com](https://github.com)
2. ✅ **Supabase account** - [supabase.com](https://supabase.com)
3. ✅ **Render account** - [render.com](https://render.com)
4. ✅ **Vercel account** - [vercel.com](https://vercel.com)
5. ✅ **Google Gemini API Key** - [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

---

## 🗄️ Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Enter a project name (e.g., `bharat-scheme-guide`)
4. Set a **secure database password** (save this!)
5. Select a region closest to your users
6. Click **"Create Project"** and wait ~2 minutes

### 1.2 Get Connection String

1. Go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual password

### 1.3 Create Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Copy the contents of `server/supabase-schema.sql`
4. Click **"Run"**
5. You should see "Success" for all statements

### 1.4 Import Schemes Data (Local)

On your local machine:

```bash
cd server

# Install dependencies (including pg)
npm install

# Set your DATABASE_URL in .env
echo "DATABASE_URL=your_supabase_connection_string" >> .env

# Import schemes to Supabase
npm run import-schemes:supabase
```

You should see "✅ Imported XXXX schemes" when complete.

---

## 🚂 Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub

```bash
git add .
git commit -m "Add Supabase PostgreSQL support"
git push origin main
```

### 2.2 Create Render Web Service

1. Go to [render.com](https://render.com) → **Dashboard**
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `bharat-scheme-api`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:pg`

### 2.3 Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update after Vercel deploy) |
| `PORT` | `3001` |

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (~3-5 minutes)
3. Copy your Render URL (e.g., `https://bharat-scheme-api.onrender.com`)

### 2.5 Verify Backend

Visit: `https://your-render-url.onrender.com/api/health`

You should see:
```json
{
  "success": true,
  "message": "JanScheme API is running",
  "database": "PostgreSQL (Supabase)"
}
```

---

## ▲ Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) → **Dashboard**
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `.` (leave as root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3.2 Add Environment Variable

Before deploying, add:
- **Name:** `VITE_API_URL`
- **Value:** `https://your-render-url.onrender.com/api`

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait ~2 minutes for build
3. Copy your Vercel URL (e.g., `https://bharat-scheme-guide.vercel.app`)

---

## 🔄 Step 4: Update CORS Settings

Go back to **Render** and update:

1. Click on your service → **Environment**
2. Update `FRONTEND_URL` to your exact Vercel URL
3. Render will automatically redeploy

---

## ✅ Step 5: Test Your Deployment

1. **Open your Vercel URL**
2. **Test search:** Search for "farmer schemes"
3. **Test chatbot:** Click the chat icon and ask a question
4. **Test scheme details:** Click on any scheme card

---

## 🔧 Troubleshooting

### "API not responding"
- Check Render logs for errors
- Verify `DATABASE_URL` is correct
- Make sure `GEMINI_API_KEY` is valid

### "CORS error"
- Update `FRONTEND_URL` in Render to exact Vercel URL
- Don't include trailing slash
- Redeploy Render service

### "Database connection failed"
- Verify Supabase connection string
- Check if password has special characters (may need URL encoding)
- Ensure Supabase project is not paused (free tier pauses after inactivity)

### "No schemes found"
- Re-run: `npm run import-schemes:supabase`
- Check Supabase SQL Editor for data in `schemes` table

---

## 💰 Cost Summary

| Service | Free Tier |
|---------|-----------|
| **Vercel** | ✅ Free for personal projects |
| **Render** | ✅ Free tier (spins down after 15min inactivity) |
| **Supabase** | ✅ 500MB database, pauses after 7 days inactivity |
| **Gemini API** | ✅ Free tier with generous limits |

> **Note:** Free tiers have cold start times. First request may take 30-60 seconds after inactivity.

---

## 📝 Updating Your App

After making code changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Both Vercel and Render will **automatically redeploy**!
