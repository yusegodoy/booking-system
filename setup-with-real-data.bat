@echo off
echo 🚀 Configurando backup con datos reales de MongoDB...

echo.
echo 📋 Este script configurará el backup para usar los datos reales exportados
echo    de tu base de datos MongoDB local.

echo.
echo ⚙️ Configurando backend con datos reales...
if not exist backend-admin\.env (
    echo # Configuración para desarrollo local (usando datos reales) > backend-admin\.env
    echo MONGODB_URI=mongodb://localhost:27017/booking-admin >> backend-admin\.env
    echo JWT_SECRET=airportshuttletpa-jwt-secret-2024-local-development >> backend-admin\.env
    echo JWT_EXPIRES_IN=24h >> backend-admin\.env
    echo PORT=5001 >> backend-admin\.env
    echo NODE_ENV=development >> backend-admin\.env
    echo CORS_ORIGIN=http://localhost:3000 >> backend-admin\.env
    echo ✅ Archivo .env creado en backend-admin
) else (
    echo ℹ️ El archivo .env ya existe en backend-admin
)

echo.
echo 📦 Instalando dependencias del backend...
cd backend-admin
call npm install
cd ..

echo.
echo 🏗️ Construyendo backend...
cd backend-admin
call npm run build
cd ..

echo.
echo ⚙️ Configurando frontend...
if not exist .env (
    echo REACT_APP_API_BASE_URL=http://localhost:5001/api > .env
    echo REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCt4x1Zu_Cgtfdu8Tst65C871kVabm4ZCk >> .env
    echo ✅ Archivo .env creado en frontend
) else (
    echo ℹ️ El archivo .env ya existe en frontend
)

echo.
echo 📦 Instalando dependencias del frontend...
call npm install

echo.
echo 🔄 Restaurando datos reales de MongoDB...
cd backend-admin
call node ../restore-real-data.js
cd ..

echo.
echo 🎉 ¡Configuración completada con datos reales!

echo.
echo 💡 Próximos pasos:
echo 1. Asegúrate de que MongoDB esté corriendo
echo 2. Inicia el backend: cd backend-admin && npm run dev
echo 3. Inicia el frontend: npm start
echo 4. Abre http://localhost:3000 en tu navegador

echo.
echo 📊 Datos restaurados:
echo    - VehicleTypes: 1 (Minivan)
echo    - Users: 2
echo    - Customers: 3
echo    - Bookings: 10
echo    - Drivers: 1

pause
