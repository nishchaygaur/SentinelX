# SentinelX — Frontend Deployment on Vercel

## 1. Overview

The React 19 + Vite 8 frontend is configured for zero-configuration, continuous deployment on **Vercel**.

Configuration: `frontend/vercel.json`.

---

## 2. Step-by-Step Vercel Deployment

1. **Import Repository**:
   - Navigate to [Vercel Dashboard](https://vercel.com/new).
   - Select your SentinelX GitHub repository.
2. **Configure Build Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Set Environment Variables**:
   - `VITE_API_URL`: Set to your Render backend API URL (e.g. `https://sentinelx-api.onrender.com/api`).
4. **Deploy**:
   - Click **Deploy**. Vercel assigns your production URL (e.g. `https://sentinelx.vercel.app`).
