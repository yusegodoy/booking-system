# Script de diagnóstico para verificar el acceso móvil
Write-Host "Diagnosticando acceso móvil..." -ForegroundColor Green
Write-Host ""

# Obtener IP local
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress | Select-Object -First 1
Write-Host "IP Local detectada: $ipAddress" -ForegroundColor Cyan

# Verificar si los puertos están abiertos
Write-Host "Verificando puertos..." -ForegroundColor Yellow

# Puerto 3000 (Frontend)
try {
    $response = Invoke-WebRequest -Uri "http://$ipAddress`:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend (puerto 3000): Accesible" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend (puerto 3000): No accesible - $($_.Exception.Message)" -ForegroundColor Red
}

# Puerto 5001 (Backend)
try {
    $response = Invoke-WebRequest -Uri "http://$ipAddress`:5001/api/vehicle-types" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend (puerto 5001): Accesible" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend (puerto 5001): No accesible - $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar reglas de firewall
Write-Host "Verificando reglas de firewall..." -ForegroundColor Yellow
$firewallRules = netsh advfirewall firewall show rule name=all | findstr "3000\|5001"
if ($firewallRules) {
    Write-Host "✅ Reglas de firewall encontradas" -ForegroundColor Green
    $firewallRules | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "❌ No se encontraron reglas de firewall para los puertos 3000 y 5001" -ForegroundColor Red
    Write-Host "  Ejecuta 'configure-firewall.ps1' como administrador" -ForegroundColor Yellow
}

# Verificar procesos
Write-Host "Verificando procesos..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {$_.ProcessName -eq "node"}
if ($processes) {
    Write-Host "✅ Procesos Node.js encontrados: $($processes.Count)" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontraron procesos Node.js" -ForegroundColor Red
}

Write-Host ""
Write-Host "URLs para acceso móvil:" -ForegroundColor Cyan
Write-Host "Frontend: http://$ipAddress`:3000" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "Backend: http://$ipAddress`:5001" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
