@echo off
title 🛑 STOP BOOKING SYSTEM
color 0C

echo.
echo ========================================
echo    🛑 STOPPING BOOKING SYSTEM
echo ========================================
echo.

echo [1/3] Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Node.js processes stopped
) else (
    echo    No Node.js processes found
)

echo [2/3] Stopping npm processes...
taskkill /f /im npm.cmd >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ npm processes stopped
) else (
    echo    No npm processes found
)

echo [3/3] Stopping nodemon processes...
taskkill /f /im nodemon.cmd >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ nodemon processes stopped
) else (
    echo    No nodemon processes found
)

echo.
echo ========================================
echo    ✅ ALL SERVICES STOPPED!
echo ========================================
echo.
echo Backend and frontend servers have been stopped.
echo MongoDB is still running (you can stop it manually if needed).
echo.
echo Press any key to close...
pause >nul
