#!/bin/bash

# Skill Swap Deployment Script

echo "🚀 Starting Skill Swap Deployment..."

# Install dependencies
echo "📦 Installing Backend Dependencies..."
cd backend
npm install

echo "📦 Installing Frontend Dependencies..."
cd ../frontend
npm install

# Build frontend
echo "🔨 Building Frontend..."
npm run build

echo "✅ Build completed! Your project is ready for deployment."
echo ""
echo "📋 Next Steps:"
echo "1. Set up MongoDB Atlas database"
echo "2. Configure environment variables"
echo "3. Deploy to your chosen platform"
echo ""
echo "See DEPLOYMENT-GUIDE.md for detailed instructions."#!/bin/bash

# Skill Swap Deployment Script

echo "🚀 Starting Skill Swap Deployment..."

# Install dependencies
echo "📦 Installing Backend Dependencies..."
cd backend
npm install

echo "📦 Installing Frontend Dependencies..."
cd ../frontend
npm install

# Build frontend
echo "🔨 Building Frontend..."
npm run build

echo "✅ Build completed! Your project is ready for deployment."
echo ""
echo "📋 Next Steps:"
echo "1. Set up MongoDB Atlas database"
echo "2. Configure environment variables"
echo "3. Deploy to your chosen platform"
echo ""
echo "See DEPLOYMENT-GUIDE.md for detailed instructions."