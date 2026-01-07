@echo off
echo Restarting CompanyHub Backend Server...
echo.

REM Kill any existing Node.js processes on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Stopping process %%a
    taskkill /PID %%a /F 2>nul
)

echo.
echo Starting backend server...
cd backend
start "CompanyHub Backend" cmd /k "npm run dev"

echo.
echo Backend server restarted!
echo Check the new terminal window for server logs.
pause