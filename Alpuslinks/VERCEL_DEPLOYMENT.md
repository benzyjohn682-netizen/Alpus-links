# Vercel Deployment Guide

## 🚀 Quick Fix for 404 Error

The 404 error occurs because Vercel doesn't know your project structure. Here's how to fix it:

### 1. Vercel Configuration (Already Created)
- ✅ `vercel.json` - Tells Vercel to build from `frontend` directory
- ✅ `.vercelignore` - Excludes backend and unnecessary files

### 2. Environment Variables Setup

In your Vercel dashboard, add these environment variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### 3. Backend Deployment Options

Since this is a full-stack app, you need to deploy the backend separately:

#### Option A: Deploy Backend to Railway/Render/Heroku
1. Deploy backend to a service like Railway, Render, or Heroku
2. Update `NEXT_PUBLIC_API_URL` in Vercel with your backend URL

#### Option B: Use Vercel Serverless Functions
1. Move backend API routes to `frontend/pages/api/` or `frontend/app/api/`
2. This keeps everything in one Vercel deployment

### 4. Redeploy

After making these changes:
1. Commit and push to your repository
2. Vercel will automatically redeploy
3. The 404 error should be resolved

### 5. Current Project Structure
```
├── frontend/          # Next.js app (deployed to Vercel)
├── backend/           # Node.js API (deploy separately)
├── vercel.json        # Vercel configuration
└── .vercelignore      # Files to ignore
```

### 6. Testing Locally
```bash
# Test the build
npm run build

# Test locally
npm run dev
```

## 🔧 Troubleshooting

If you still get 404 errors:
1. Check Vercel build logs
2. Ensure all dependencies are installed
3. Verify environment variables are set
4. Check that the build completes successfully
