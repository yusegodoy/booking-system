# Script para configurar el firewall de Windows para permitir acceso desde la red local
# Debe ejecutarse como Administrador

Write-Host "Configurando firewall para acceso móvil..." -ForegroundColor Green

# Verificar si se está ejecutando como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Este script debe ejecutarse como Administrador." -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit
}

# Agregar regla para puerto 3000 (Frontend)
Write-Host "Configurando regla para puerto 3000 (Frontend)..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="React App 3000" dir=in action=allow protocol=TCP localport=3000 remoteip=192.168.0.0/16

# Agregar regla para puerto 5001 (Backend)
Write-Host "Configurando regla para puerto 5001 (Backend)..." -ForegroundColor Yellow
netsh advfirewall firewall add rule name="Node.js Backend 5001" dir=in action=allow protocol=TCP localport=5001 remoteip=192.168.0.0/16

# Verificar las reglas creadas
Write-Host "Verificando reglas creadas..." -ForegroundColor Cyan
netsh advfirewall firewall show rule name="React App 3000"
netsh advfirewall firewall show rule name="Node.js Backend 5001"

Write-Host ""
Write-Host "¡Configuración completada!" -ForegroundColor Green
Write-Host "Ahora puedes acceder desde dispositivos móviles usando:" -ForegroundColor Cyan
Write-Host "http://192.168.4.213:3000" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
