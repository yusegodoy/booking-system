# 🚀 Guía de Desarrollo Local - Sistema de Reservas

## ✅ **ESTADO ACTUAL**

**Tu aplicación está completamente configurada para desarrollo local con los mismos datos de producción.**

## 🎯 **CONFIGURACIÓN ACTUAL**

### **Base de Datos**
- ✅ **MongoDB Atlas** - Misma base de datos que producción
- ✅ **Datos sincronizados** - Todos los datos están disponibles localmente
- ✅ **Sin configuración adicional** - No necesitas MongoDB local

### **Servicios**
- ✅ **Backend**: `http://localhost:5001`
- ✅ **Frontend**: `http://localhost:3000`
- ✅ **API**: Conectada a MongoDB Atlas

## 🚀 **INICIAR DESARROLLO LOCAL**

### **Método Rápido (Recomendado)**
```bash
# Doble clic en el archivo:
start-local-development.bat
```

### **Método Manual**
```bash
# 1. Configurar variables de entorno
copy backend-admin\env.local backend-admin\.env
copy env.local.frontend .env

# 2. Iniciar Backend
cd backend-admin
npm run dev

# 3. Iniciar Frontend (nueva terminal)
npm start
```

## 📁 **ARCHIVOS DE CONFIGURACIÓN**

### **Backend (.env)**
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://administrator-booking:Acer84010702@airportshuttletpa.wapwkji.mongodb.net/?retryWrites=true&w=majority&appName=airportshuttletpa
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:3000
```

### **Frontend (.env)**
```env
REACT_APP_API_BASE_URL=http://localhost:5001/api
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCt4x1Zu_Cgtfdu8Tst65C871kVabm4ZCk
PORT=3000
NODE_ENV=development
```

## 🔄 **FLUJO DE DESARROLLO**

### **1. Desarrollo Local**
- ✅ Modifica código en `src/` (frontend) o `backend-admin/src/` (backend)
- ✅ Los cambios se reflejan automáticamente (hot reload)
- ✅ Usa los mismos datos de producción

### **2. Testing**
- ✅ Prueba nuevas funcionalidades localmente
- ✅ Verifica que todo funcione correctamente
- ✅ Usa las mismas credenciales de producción

### **3. Deploy a Producción**
```bash
# 1. Commit cambios
git add .
git commit -m "Nueva funcionalidad"
git push origin main

# 2. Railway detecta cambios automáticamente
# 3. Deploy automático en 2-3 minutos
```

## 🛠️ **COMANDOS ÚTILES**

### **Backend**
```bash
cd backend-admin

# Desarrollo
npm run dev

# Compilar
npm run build

# Producción
npm run start:production

# Limpiar y reinstalar
npm run clean
npm install
```

### **Frontend**
```bash
# Desarrollo
npm start

# Compilar para producción
npm run build

# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 🔐 **CREDENCIALES DE DESARROLLO**

### **Admin Portal**
- **Email**: `info@airportshuttletpa.com`
- **Password**: (la contraseña original de tu base de datos)

### **Base de Datos**
- **MongoDB Atlas**: Misma conexión que producción
- **Datos**: Vehicle types, usuarios, bookings reales

## 📊 **VENTAJAS DEL SETUP ACTUAL**

1. ✅ **Datos reales** - No necesitas datos de prueba
2. ✅ **Sincronización** - Cambios locales se reflejan en producción
3. ✅ **Sin configuración** - No necesitas MongoDB local
4. ✅ **Deploy fácil** - Git push automático a Railway
5. ✅ **Testing completo** - Mismas condiciones que producción

## 🚨 **IMPORTANTE**

- **NO modifiques** datos críticos en desarrollo
- **Usa datos de prueba** para nuevas funcionalidades
- **Haz backups** antes de cambios importantes
- **Testa localmente** antes de hacer push a producción

## 🎯 **PRÓXIMOS PASOS**

1. **Inicia desarrollo local**: `start-local-development.bat`
2. **Haz tus mejoras** en el código
3. **Testa localmente** con datos reales
4. **Deploy a producción**: `git push origin main`

**¡Tu entorno de desarrollo está listo para usar!** 🚀
