@echo off
echo 🔧 Configurando archivos .env para desarrollo local...

echo.
echo ⚙️ Configurando backend...
if not exist backend-admin\.env (
    copy backend-admin\env.local.development backend-admin\.env
    echo ✅ Archivo .env creado en backend-admin
) else (
    echo ℹ️ El archivo .env ya existe en backend-admin
)

echo.
echo ⚙️ Configurando frontend...
if not exist .env (
    echo REACT_APP_API_BASE_URL=http://localhost:5001/api > .env
    echo REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyDmGneyTKBsTG52pm2zdPHvZiCC_KJosio >> .env
    echo PORT=3000 >> .env
    echo NODE_ENV=development >> .env
    echo ✅ Archivo .env creado en frontend
) else (
    echo ℹ️ El archivo .env ya existe en frontend
)

echo.
echo 🎉 Configuración completada!
echo.
echo 📋 Para iniciar el desarrollo:
echo 1. Inicia MongoDB local (si usas base de datos local)
echo 2. Ejecuta: cd backend-admin ^&^& npm run dev
echo 3. En otra terminal: npm start
echo.
pause
