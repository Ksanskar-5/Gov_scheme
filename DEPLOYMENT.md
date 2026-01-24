# 🚀 Deployment Guide: Vercel + Railway

This guide will help you deploy the **Bharat Scheme Guide** application using:
- **Vercel** for the React frontend
- **Railway** for the Node.js backend

---

## 📋 Prerequisites

Before starting, make sure you have:

1. ✅ A **GitHub account** (https://github.com)
2. ✅ A **Vercel account** (https://vercel.com) - Sign up with GitHub
3. ✅ A **Railway account** (https://railway.app) - Sign up with GitHub
4. ✅ A **Google Gemini API Key** (https://aistudio.google.com/apikey) - Free!

---

## 🔑 Step 1: Get Your Gemini API Key

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy and save the API key somewhere safe (you'll need it later)

---

## 📤 Step 2: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# In your project directory
cd /Users/ksanskar/Work/GOV_SCHEME

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add your GitHub repo as remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/bharat-scheme-guide.git

# Push to GitHub
git push -u origin main
```

---

## 🚂 Step 3: Deploy Backend to Railway

### 3.1 Create Railway Project

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. **Important:** Select only the `server` folder:
   - Click on your repo
   - Railway will auto-detect it
   - When asked, select **"server"** as the root directory

### 3.2 Configure Environment Variables

After Railway creates your project:

1. Click on your service
2. Go to **"Variables"** tab
3. Add these variables (click "New Variable" for each):

| Variable | Value |
|----------|-------|
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `GEMINI_API_KEY` | `your_api_key_from_step_1` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update after Vercel deploy) |
| `DATABASE_PATH` | `./data/schemes.db` |
| `RATE_LIMIT_WINDOW_MS` | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |

### 3.3 Deploy

1. Railway will automatically deploy after you add variables
2. Wait for the build to complete (2-3 minutes)
3. Click **"Settings"** → **"Generate Domain"**
4. Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

### 3.4 Verify Backend

Open your Railway URL in browser:
```
https://your-app.up.railway.app/api/health
```

You should see:
```json
{
  "success": true,
  "message": "JanScheme API is running"
}
```

---

## ▲ Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Project

1. Go to **https://vercel.com**
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose your repository
5. In the configuration:
   - **Framework Preset:** Vite
   - **Root Directory:** `.` (leave as root, not server)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 4.2 Add Environment Variable

Before deploying, add the backend URL:

1. Expand **"Environment Variables"**
2. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-railway-app.up.railway.app/api` (your Railway URL + /api)

### 4.3 Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes for the build
3. Click on the generated URL to view your site!

---

## 🔄 Step 5: Update Railway with Frontend URL

Now that Vercel is deployed, update Railway:

1. Go back to **Railway**
2. Click on your service → **"Variables"**
3. Update `FRONTEND_URL` with your Vercel URL:
   - Example: `https://bharat-scheme-guide.vercel.app`
4. Railway will automatically redeploy

---

## ✅ Step 6: Test Your Deployment

1. **Open your Vercel URL**
2. **Test the search:** Search for "farmer schemes"
3. **Test the chatbot:** Click the chat icon and ask a question
4. **Test scheme details:** Click on any scheme card

---

## 🎉 Congratulations!

Your application is now live! Share your Vercel URL with others.

---

## 🔧 Troubleshooting

### "API not responding"
- Check Railway logs for errors
- Verify `GEMINI_API_KEY` is correct
- Make sure `FRONTEND_URL` includes `https://`

### "CORS error"
- Update `FRONTEND_URL` in Railway to match your exact Vercel URL
- Don't include trailing slash

### "Chat not working"
- Verify your Gemini API key is valid
- Check Railway logs for AI-related errors

### "No schemes found"
- The database import may have failed
- In Railway, click "Redeploy" to re-run the import script

---

## 📝 Updating Your App

After making code changes:

1. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Both Vercel and Railway will **automatically redeploy**!

---

## 💰 Cost

- **Vercel:** Free for personal projects
- **Railway:** Free trial, then ~$5/month for hobby plan
- **Gemini API:** Free tier available (generous limits)

