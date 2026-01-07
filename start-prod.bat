@echo off
echo ========================================
echo  Starting Admin Dashboard (Production)
echo ========================================
echo.

echo Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo MongoDB is not running. Starting MongoDB service...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo Error: Could not start MongoDB service
        pause
        exit /b 1
    )
) else (
    echo MongoDB is already running
)

echo.
echo Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Error: Frontend build failed
    pause
    exit /b 1
)
cd ..

echo.
echo Starting production servers with PM2...
pm2 start ecosystem.config.js
if %errorlevel% neq 0 (
    echo Error: Failed to start with PM2
    echo Make sure PM2 is installed: npm install -g pm2
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Production servers started successfully!
echo ========================================
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:5000
echo.
echo Use the following commands to manage:
echo - pm2 status          : Check status
echo - pm2 logs            : View logs
echo - pm2 restart all     : Restart all
echo - pm2 stop all        : Stop all
echo ========================================
pause