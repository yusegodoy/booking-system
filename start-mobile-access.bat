@echo off
echo Starting Transport Booking System for Mobile Access...
echo.

echo Setting environment variable for mobile access...
set REACT_APP_API_BASE_URL=http://192.168.4.213:5001/api

echo Starting backend server...
cd backend-admin
start "Backend Server" cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting frontend server...
cd ..
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://192.168.4.213:5001
echo Frontend: http://192.168.4.213:3000
echo.
echo You can now access the application from any device on your network using:
echo http://192.168.4.213:3000
echo.
pause
