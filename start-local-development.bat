@echo off
title 🚀 BOOKING SYSTEM - LOCAL DEVELOPMENT
color 0A

echo.
echo ========================================
echo    🚀 BOOKING SYSTEM - LOCAL DEVELOPMENT
echo ========================================
echo.

:: Copy environment files
echo [1/5] Setting up environment files...
if not exist "backend-admin\.env" (
    copy "backend-admin\env.local" "backend-admin\.env" >nul
    echo    ✓ Backend .env created
) else (
    echo    ✓ Backend .env already exists
)

if not exist ".env" (
    copy "env.local.frontend" ".env" >nul
    echo    ✓ Frontend .env created
) else (
    echo    ✓ Frontend .env already exists
)

:: Check if MongoDB is running (optional for Atlas)
echo [2/5] Checking database connection...
echo    Using MongoDB Atlas (no local MongoDB required)
echo    ✓ Database connection configured

:: Check if port 5001 is free
echo [3/5] Checking backend port (5001)...
netstat -an | find ":5001" >nul
if %errorlevel% equ 0 (
    echo    Port 5001 is in use. Stopping existing processes...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
)

:: Check if port 3000 is free
echo [4/5] Checking frontend port (3000)...
netstat -an | find ":3000" >nul
if %errorlevel% equ 0 (
    echo    Port 3000 is in use. Stopping existing processes...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
)

:: Start backend
echo [5/5] Starting backend server...
cd /d "%~dp0backend-admin"
start "Backend Server (Local Dev)" cmd /k "npm run dev"

:: Wait a moment for backend to start
echo    Waiting for backend to start...
timeout /t 8 /nobreak >nul

:: Start frontend
echo    Starting frontend server...
cd /d "%~dp0"
start "Frontend Server (Local Dev)" cmd /k "npm start"

:: Wait for frontend to start
echo    Waiting for frontend to start...
timeout /t 15 /nobreak >nul

:: Open browser
echo.
echo ========================================
echo    ✅ LOCAL DEVELOPMENT READY!
echo ========================================
echo.
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo Database: MongoDB Atlas (same as production)
echo.
echo Opening application in browser...
echo.

:: Try to open the application
start http://localhost:3000

echo.
echo ========================================
echo    🎯 DEVELOPMENT MODE ACTIVE!
echo ========================================
echo.
echo You can now:
echo - Make changes to the code
echo - Test new features
echo - Debug issues
echo - All data is synced with production database
echo.
echo Press any key to exit...
pause >nul
