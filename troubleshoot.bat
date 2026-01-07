@echo off
echo ========================================
echo  Admin Dashboard - Troubleshooting
echo ========================================
echo.

echo [1] Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo Node.js is installed
)

echo.
echo [2] Checking npm installation...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
) else (
    echo npm is available
)

echo.
echo [3] Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo WARNING: MongoDB service is not running
    echo Attempting to start MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo ERROR: Could not start MongoDB
        echo Please install MongoDB Community Edition from:
        echo https://www.mongodb.com/try/download/community
        echo.
        echo Or start MongoDB manually:
        echo "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
    ) else (
        echo MongoDB started successfully
    )
) else (
    echo MongoDB is running
)

echo.
echo [4] Checking project dependencies...
if not exist "node_modules" (
    echo Installing root dependencies...
    npm install
)

if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo.
echo [5] Checking environment files...
if not exist "backend\.env" (
    echo Creating backend/.env from example...
    copy "backend\.env.example" "backend\.env"
)

if not exist "frontend\.env.local" (
    echo Creating frontend/.env.local from example...
    copy "frontend\.env.local.example" "frontend\.env.local"
)

echo.
echo [6] Testing MongoDB connection...
cd backend
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/admin_dashboard')
  .then(() => {
    console.log('✓ MongoDB connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.log('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });
"
cd ..

echo.
echo [7] Checking ports availability...
netstat -an | find ":3000" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo WARNING: Port 3000 is already in use
    echo Please stop any running applications on port 3000
)

netstat -an | find ":5000" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo WARNING: Port 5000 is already in use
    echo Please stop any running applications on port 5000
)

echo.
echo ========================================
echo  Troubleshooting Complete
echo ========================================
echo.
echo If all checks passed, try running:
echo   npm run seed    (to populate database)
echo   npm run dev     (to start development servers)
echo.
echo If you're still having issues:
echo 1. Check Windows Firewall settings
echo 2. Try running as Administrator
echo 3. Check antivirus software blocking Node.js
echo 4. Restart your computer
echo ========================================
pause