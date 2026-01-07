@echo off
echo ========================================
echo  Admin Dashboard System - Windows Setup
echo ========================================
echo.

echo [1/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install root dependencies
    pause
    exit /b 1
)

echo [2/6] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo [3/6] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo [4/6] Setting up environment files...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo Created backend/.env from example
) else (
    echo backend/.env already exists, skipping...
)

if not exist "frontend\.env.local" (
    copy "frontend\.env.local.example" "frontend\.env.local"
    echo Created frontend/.env.local from example
) else (
    echo frontend/.env.local already exists, skipping...
)

echo [5/6] Creating logs directory...
if not exist "logs" mkdir logs

echo [6/6] Setup complete!
echo.
echo ========================================
echo  Next Steps:
echo ========================================
echo 1. Start MongoDB service:
echo    net start MongoDB
echo.
echo 2. Seed the database:
echo    npm run seed
echo.
echo 3. Start development servers:
echo    npm run dev
echo.
echo 4. Open your browser to:
echo    http://localhost:3000
echo.
echo Default login credentials:
echo - Admin: admin@example.com / admin123
echo - User: user@example.com / user123
echo ========================================
pause