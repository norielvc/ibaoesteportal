@echo off
echo ========================================
echo   DEPLOYING ADMIN DASHBOARD ONLINE
echo ========================================
echo.

echo Step 1: Building frontend for production...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed!
    pause
    exit /b 1
)
echo ✅ Frontend build successful!
echo.

cd ..

echo Step 2: Deployment Instructions
echo.
echo 🚀 BACKEND DEPLOYMENT (Railway):
echo 1. Go to https://railway.app
echo 2. Sign up/login with GitHub
echo 3. Click "New Project" → "Deploy from GitHub repo"
echo 4. Select this repository
echo 5. Choose "backend" as root directory
echo 6. Add these environment variables:
echo    NODE_ENV=production
echo    PORT=5005
echo    JWT_SECRET=your-super-secret-jwt-key
echo    SUPABASE_URL=your-supabase-url
echo    SUPABASE_ANON_KEY=your-supabase-anon-key
echo    FRONTEND_URL=https://your-app.vercel.app
echo.
echo 🌐 FRONTEND DEPLOYMENT (Vercel):
echo 1. Go to https://vercel.com
echo 2. Sign up/login with GitHub
echo 3. Click "Add New" → "Project"
echo 4. Import this GitHub repository
echo 5. Set Root Directory to "frontend"
echo 6. Add environment variable:
echo    NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
echo.
echo 📋 After deployment:
echo 1. Update FRONTEND_URL in Railway with your Vercel URL
echo 2. Update NEXT_PUBLIC_API_URL in Vercel with your Railway URL
echo 3. Redeploy both services
echo.
echo ✅ Ready for deployment!
pause