@echo off
echo 🔐 Configurando credenciales para desarrollo local...
echo.
echo ⚠️  IMPORTANTE: Este es un archivo de ejemplo
echo ⚠️  NO contiene credenciales reales por seguridad
echo.
echo Para configurar las credenciales reales:
echo 1. Copia este archivo como setup-new-credentials.bat
echo 2. Reemplaza los valores de ejemplo con tus credenciales reales
echo 3. Ejecuta setup-new-credentials.bat
echo.

echo.
echo ⚙️ Configurando backend...
echo if not exist backend-admin\.env (
echo     echo # Backend Environment Variables for Local Development ^> backend-admin\.env
echo     echo JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_HERE ^>^> backend-admin\.env
echo     echo MONGODB_URI=mongodb://localhost:27017/booking-admin ^>^> backend-admin\.env
echo     echo PORT=5001 ^>^> backend-admin\.env
echo     echo NODE_ENV=development ^>^> backend-admin\.env
echo     echo CORS_ORIGIN=http://localhost:3000 ^>^> backend-admin\.env
echo     echo ✅ Archivo .env creado en backend-admin
echo ) else (
echo     echo ℹ️ El archivo .env ya existe en backend-admin
echo )

echo.
echo ⚙️ Configurando frontend...
echo if not exist .env (
echo     echo REACT_APP_API_BASE_URL=http://localhost:5001/api ^> .env
echo     echo REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE ^>^> .env
echo     echo PORT=3000 ^>^> .env
echo     echo NODE_ENV=development ^>^> .env
echo     echo ✅ Archivo .env creado en frontend
echo ) else (
echo     echo ℹ️ El archivo .env ya existe en frontend
echo )

echo.
echo 🎉 Script de ejemplo completado!
echo.
echo 📋 Para usar este script:
echo 1. Copia como setup-new-credentials.bat
echo 2. Reemplaza YOUR_*_HERE con tus credenciales reales
echo 3. Ejecuta el archivo copiado
echo.
pause
