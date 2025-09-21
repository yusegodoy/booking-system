# 🚀 Guía de Despliegue a Producción

## 📋 Resumen del Proyecto
Sistema de reservas de transporte con:
- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: MongoDB
- **Hosting**: Railway
- **Dominio**: booking.airportshuttletpa.com

## 🔧 Configuración de Railway

### 1. Backend (API)
- **Puerto**: 5001
- **Health Check**: `/health`
- **Variables de entorno necesarias**:
  ```
  MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=airportshuttletpa
  JWT_SECRET=tu-jwt-secret-super-seguro
  JWT_EXPIRES_IN=24h
  NODE_ENV=production
  FRONTEND_URL=https://booking.airportshuttletpa.com
  ```

### 2. Frontend (React)
- **Puerto**: 3000
- **Variables de entorno necesarias**:
  ```
  REACT_APP_API_BASE_URL=https://api.booking.airportshuttletpa.com/api
  REACT_APP_GOOGLE_MAPS_API_KEY=tu-google-maps-api-key-aqui
  PORT=3000
  NODE_ENV=production
  ```

## 🌐 Configuración de Dominio

### IONOS DNS
Configurar en IONOS:
- **A Record**: `booking` → IP de Railway
- **CNAME**: `booking.airportshuttletpa.com` → `tu-app.railway.app`

## 📦 Pasos de Despliegue

### 1. Crear Repositorio GitHub
```bash
cd c:\booking_backup
git init
git add .
git commit -m "Initial commit for production deployment"
git remote add origin https://github.com/tu-usuario/booking-system.git
git push -u origin main
```

### 2. Configurar Railway Backend
1. Conectar repositorio GitHub a Railway
2. Configurar variables de entorno
3. Establecer dominio personalizado

### 3. Configurar Railway Frontend
1. Crear nuevo servicio en Railway
2. Conectar mismo repositorio
3. Configurar build path: `/`
4. Configurar variables de entorno

### 4. Configurar Dominio
1. En Railway, configurar dominio personalizado
2. En IONOS, configurar DNS records
3. Esperar propagación DNS (24-48 horas)

## 🔍 Verificación
- ✅ Backend: `https://booking.airportshuttletpa.com/health`
- ✅ Frontend: `https://booking.airportshuttletpa.com`
- ✅ API: `https://booking.airportshuttletpa.com/api/vehicle-types`

## 🛠️ Comandos Útiles
```bash
# Desarrollo local
npm start                    # Frontend
cd backend-admin && npm run dev  # Backend

# Producción
npm run build               # Build frontend
cd backend-admin && npm run build && npm run start:production  # Backend
```
