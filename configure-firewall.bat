@echo off
echo Configurando firewall para acceso movil...
echo.

echo Agregando regla para puerto 3000 (Frontend)...
netsh advfirewall firewall add rule name="React App 3000" dir=in action=allow protocol=TCP localport=3000 remoteip=192.168.0.0/16

echo Agregando regla para puerto 5001 (Backend)...
netsh advfirewall firewall add rule name="Node.js Backend 5001" dir=in action=allow protocol=TCP localport=5001 remoteip=192.168.0.0/16

echo.
echo Verificando reglas creadas...
netsh advfirewall firewall show rule name="React App 3000"
netsh advfirewall firewall show rule name="Node.js Backend 5001"

echo.
echo Configuracion completada!
echo Ahora puedes acceder desde dispositivos moviles usando:
echo http://192.168.4.213:3000
echo.
pause
