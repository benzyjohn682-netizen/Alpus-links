#!/bin/bash

# Vercel build script for monorepo
echo "🚀 Starting Vercel build process..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build the Next.js app
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
