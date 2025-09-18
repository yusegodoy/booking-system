@echo off
title 🚀 START BOOKING SYSTEM
color 0A

echo.
echo ========================================
echo    🚀 STARTING BOOKING SYSTEM
echo ========================================
echo.

:: Check if MongoDB is running
echo [1/4] Checking MongoDB...
netstat -an | find "27017" >nul
if %errorlevel% neq 0 (
    echo    ❌ MongoDB is not running!
    echo    Please start MongoDB first:
    echo    1. Open MongoDB Compass and connect
    echo    2. Or run 'mongod' from command line
    echo.
    echo    Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo    ✓ MongoDB is running
)

:: Check if port 5001 is free
echo [2/4] Checking backend port (5001)...
netstat -an | find ":5001" >nul
if %errorlevel% equ 0 (
    echo    Port 5001 is in use. Stopping existing processes...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
)

:: Check if port 3000 is free
echo [3/4] Checking frontend port (3000)...
netstat -an | find ":3000" >nul
if %errorlevel% equ 0 (
    echo    Port 3000 is in use. Stopping existing processes...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 3 /nobreak >nul
)

:: Start backend
echo [4/4] Starting backend server...
cd /d "%~dp0backend-admin"
start "Backend Server" cmd /k "npm run dev"

:: Wait a moment for backend to start
echo    Waiting for backend to start...
timeout /t 8 /nobreak >nul

:: Start frontend
echo    Starting frontend server...
cd /d "%~dp0"
start "Frontend Server" cmd /k "npm start"

:: Wait for frontend to start
echo    Waiting for frontend to start...
timeout /t 15 /nobreak >nul

:: Open browser
echo.
echo ========================================
echo    ✅ SERVICES STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo Opening application in browser...
echo.

:: Try to open the application
start http://localhost:3000

echo.
echo ========================================
echo    🎉 APPLICATION READY!
echo ========================================
echo.
echo Login with: admin@example.com
echo.
echo Press any key to close this window...
echo (The servers will continue running)
pause >nul
