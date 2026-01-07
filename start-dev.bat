@echo off
echo ========================================
echo  Starting Admin Dashboard System
echo ========================================
echo.

echo Checking MongoDB service...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo MongoDB is not running. Starting MongoDB service...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo Error: Could not start MongoDB service
        echo Please ensure MongoDB is installed and configured properly
        pause
        exit /b 1
    )
) else (
    echo MongoDB is already running
)

echo.
echo Starting development servers...
echo - Backend API: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop the servers
echo.

npm run dev