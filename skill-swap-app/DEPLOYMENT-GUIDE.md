# 🚀 Skill Swap Project Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Git installed
- Firebase CLI
- MongoDB Atlas account

## 📦 Preparation Steps

### 1. Install Missing Dependencies
```bash
# Backend - Install multer
cd backend
npm install multer

# Frontend - Ensure all dependencies are installed
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend (.env)
Create/update `backend/.env`:
```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/skill-swap-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=8000
NODE_ENV=production

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

#### Frontend Environment
Create `frontend/.env`:
```env
VITE_API_URL=https://your-backend-url.com
```

### 3. Update Frontend API Configuration
Update `frontend/src/contexts/AuthContext.jsx`:
```javascript
// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

## 🔥 Firebase Deployment

### Backend Deployment (Firebase Functions)

1. **Initialize Firebase**
```bash
cd backend
npm install -g firebase-tools
firebase login
firebase init functions
```

2. **Configure Firebase Functions**
Update `backend/functions/index.js`:
```javascript
const functions = require('firebase-functions');
const express = require('express');
const app = require('./server'); // Your existing server

exports.api = functions.https.onRequest(app);
```

3. **Deploy Backend**
```bash
firebase deploy --only functions
```

### Frontend Deployment (Firebase Hosting)

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Initialize Firebase Hosting**
```bash
firebase init hosting
# Select your project
# Set public directory to 'dist'
# Configure as SPA: Yes
```

3. **Deploy Frontend**
```bash
firebase deploy --only hosting
```

## ⚡ Vercel Deployment (Alternative)

### Backend (Vercel Serverless)

1. **Create vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

2. **Deploy**
```bash
cd backend
npx vercel --prod
```

### Frontend (Vercel)
```bash
cd frontend
npx vercel --prod
```

## 🗄️ Database Setup (MongoDB Atlas)

1. **Create Cluster**
   - Go to MongoDB Atlas
   - Create free cluster
   - Setup database user
   - Whitelist IP addresses (0.0.0.0/0 for all)

2. **Get Connection String**
   - Copy connection string
   - Replace in your .env file

## 🔧 Production Optimizations

### Backend Optimizations

1. **Update CORS for production**
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
```

2. **Security Headers**
```javascript
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});
```

### Frontend Optimizations

1. **Update Profile Picture URLs**
```javascript
const getProfilePictureUrl = () => {
  if (profilePicturePreview) {
    return profilePicturePreview
  }
  if (user?.profilePicture) {
    return `${import.meta.env.VITE_API_URL}/api/users/profile-picture/${user.profilePicture}`
  }
  return null
}
```

## 📝 Deployment Checklist

- [ ] Install all dependencies (including multer)
- [ ] Set up MongoDB Atlas
- [ ] Configure environment variables
- [ ] Update API URLs for production
- [ ] Build frontend (`npm run build`)
- [ ] Deploy backend to chosen platform
- [ ] Deploy frontend to chosen platform
- [ ] Test all functionality
- [ ] Set up custom domain (optional)

## 🚨 Common Issues & Solutions

### CORS Issues
```javascript
// Backend - Update CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

### Environment Variables
- Ensure all env vars are set in deployment platform
- Use platform-specific environment variable settings

### File Uploads
- Consider using cloud storage (AWS S3, Firebase Storage) for file uploads in production
- Current local file storage won't work on serverless platforms

## 🔗 Platform-Specific Guides

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway project:new
railway deploy
```

### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Create app and deploy
heroku create your-app-name
git push heroku main
```

## 📊 Monitoring & Analytics

1. **Error Tracking**: Consider adding Sentry
2. **Analytics**: Add Google Analytics
3. **Performance**: Monitor with tools like Lighthouse

## 🔐 Security Considerations

1. **JWT Secret**: Use strong, unique secret
2. **Database**: Restrict IP access
3. **HTTPS**: Ensure SSL certificates
4. **Rate Limiting**: Add rate limiting middleware
5. **Input Validation**: Validate all inputs

---

Choose the deployment method that best fits your needs and budget!