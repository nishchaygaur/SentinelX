# SentinelX — Backend Deployment on Render

## 1. Overview

The Express backend deploys on **Render** as a managed Web Service. Render reads the repository's Infrastructure-as-Code blueprint at `render.yaml`.

---

## 2. Deployment via Blueprint (`render.yaml`)

1. In [Render Dashboard](https://dashboard.render.com/), click **New** → **Blueprint**.
2. Connect your GitHub repository.
3. Render automatically provisions:
   - Service name: `sentinelx-backend`
   - Runtime: `node`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/health`
4. Configure Secret Environment Variables in Render:
   - `DATABASE_URL`: Your Supabase connection string.
   - `CORS_ORIGIN`: Your Vercel frontend URL.
   - `OPENROUTER_API_KEY`: Secret OpenRouter key.
   - `LOG_INGESTION_TOKEN`: Shared secret for remote log shippers.
