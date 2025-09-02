@echo off
echo 🚀 Starting Skill Swap Deployment...

REM Install dependencies
echo 📦 Installing Backend Dependencies...
cd backend
call npm install

echo 📦 Installing Frontend Dependencies...
cd ..\frontend
call npm install

REM Build frontend
echo 🔨 Building Frontend...
call npm run build

echo ✅ Build completed! Your project is ready for deployment.
echo.
echo 📋 Next Steps:
echo 1. Set up MongoDB Atlas database
echo 2. Configure environment variables
echo 3. Deploy to your chosen platform
echo.
echo See DEPLOYMENT-GUIDE.md for detailed instructions.
pause@echo off
echo 🚀 Starting Skill Swap Deployment...

REM Install dependencies
echo 📦 Installing Backend Dependencies...
cd backend
call npm install

echo 📦 Installing Frontend Dependencies...
cd ..\frontend
call npm install

REM Build frontend
echo 🔨 Building Frontend...
call npm run build

echo ✅ Build completed! Your project is ready for deployment.
echo.
echo 📋 Next Steps:
echo 1. Set up MongoDB Atlas database
echo 2. Configure environment variables
echo 3. Deploy to your chosen platform
echo.
echo See DEPLOYMENT-GUIDE.md for detailed instructions.
pause