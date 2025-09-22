@echo off
echo 🔐 Configurando nuevas credenciales para desarrollo local...

echo.
echo ⚙️ Configurando backend...
if not exist backend-admin\.env (
    copy backend-admin\env.local.development backend-admin\.env
    echo ✅ Archivo .env creado en backend-admin con nuevas credenciales
) else (
    echo ℹ️ El archivo .env ya existe en backend-admin
)

echo.
echo ⚙️ Configurando frontend...
if not exist .env (
    echo REACT_APP_API_BASE_URL=http://localhost:5001/api > .env
    echo REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAmvLXQ9H-vxLl6N2iVp9G_3loPsVPhxCg >> .env
    echo PORT=3000 >> .env
    echo NODE_ENV=development >> .env
    echo ✅ Archivo .env creado en frontend con nueva API key
) else (
    echo ℹ️ El archivo .env ya existe en frontend
)

echo.
echo 🎉 Nuevas credenciales configuradas!
echo.
echo 📋 CREDENCIALES ACTUALIZADAS:
echo - Google Maps API Key: AIzaSyAmvLXQ9H-vxLl6N2iVp9G_3loPsVPhxCg
echo - JWT Secret: 1bfaHL6u4sGR5YBdC8Metpn3KcJmogzT
echo - MongoDB Password: Acer84010702785
echo.
echo ⚠️  IMPORTANTE: Estas credenciales están SOLO para desarrollo local
echo ⚠️  NO se subirán al repositorio por seguridad
echo.
pause
