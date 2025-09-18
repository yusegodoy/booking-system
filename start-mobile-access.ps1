# PowerShell script to start the application for mobile access
Write-Host "Starting Transport Booking System for Mobile Access..." -ForegroundColor Green
Write-Host ""

# Get the current IP address
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress | Select-Object -First 1

if (-not $ipAddress) {
    Write-Host "Could not find local IP address. Using default 192.168.4.213" -ForegroundColor Yellow
    $ipAddress = "192.168.4.213"
}

Write-Host "Detected IP Address: $ipAddress" -ForegroundColor Cyan

# Set environment variable
$env:REACT_APP_API_BASE_URL = "http://$ipAddress`:5001/api"

Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend-admin; npm run dev"

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd .; npm start"

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Backend: http://$ipAddress`:5001" -ForegroundColor Cyan
Write-Host "Frontend: http://$ipAddress`:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now access the application from any device on your network using:" -ForegroundColor Green
Write-Host "http://$ipAddress`:3000" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
