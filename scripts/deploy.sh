#!/bin/bash

# Fake Calendar Filler Deployment Script
# This script builds and deploys the application for production

set -e  # Exit on any error

echo "🚀 Starting deployment for Fake Calendar Filler..."

# Check if required files exist
if [ ! -f "config/credentials.json" ]; then
    echo "❌ Error: config/credentials.json not found. Please add your Google OAuth credentials."
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build frontend
echo "🏗️  Building frontend..."
pnpm run build

# Verify build exists
if [ ! -d "frontend/dist" ]; then
    echo "❌ Error: Frontend build failed - dist directory not found."
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📋 Deployment Instructions:"
echo "1. Copy all files to your production server"
echo "2. Set NODE_ENV=production"
echo "3. Install dependencies: pnpm install --prod"
echo "4. Start the server: pnpm start"
echo ""
echo "🌐 The application will be available on port 3000"
echo "📝 Make sure your Google OAuth redirect URI is set to: https://yourdomain.com/oauth2callback"
echo ""
echo "🎉 Ready for deployment!"
