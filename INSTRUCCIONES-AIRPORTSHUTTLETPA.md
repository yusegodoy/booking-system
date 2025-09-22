# 🚀 INSTRUCCIONES ESPECÍFICAS PARA AIRPORTSHUTTLETPA.COM

## 📋 INFORMACIÓN DE TU SETUP
- **Dominio**: https://airportshuttletpa.com
- **Hosting**: Ionos Webspace
- **Acceso**: SFTP & SSH disponible ✅
- **Databases**: Disponible ✅
- **PHP**: Configurado ✅

## 🎯 PLAN DE IMPLEMENTACIÓN (2 DÍAS)

### **DÍA 1: CONFIGURAR BACKEND EXTERNO**
1. ✅ Crear cuenta en Railway (gratuito)
2. ✅ Subir backend a Railway
3. ✅ Configurar base de datos MongoDB
4. ✅ Configurar variables de entorno

### **DÍA 2: SUBIR FRONTEND A IONOS**
1. ✅ Construir frontend para producción
2. ✅ Subir por SFTP a Ionos
3. ✅ Configurar dominio
4. ✅ Probar funcionamiento

---

## 📝 PASO 1: CREAR CUENTA EN RAILWAY

### 1.1 Ir a Railway
- Ve a: https://railway.app
- Haz clic en "Start a New Project"
- Conéctate con GitHub (recomendado)

### 1.2 Crear Proyecto
- Nombre: `airportshuttletpa-backend`
- Template: `Empty Project`

---

## 📝 PASO 2: CONFIGURAR BACKEND EN RAILWAY

### 2.1 Subir Código del Backend
1. **Crear repositorio en GitHub** (si no tienes)
2. **Subir carpeta `backend-admin`** al repositorio
3. **Conectar Railway** con el repositorio
4. **Seleccionar** la carpeta `backend-admin`

### 2.2 Configurar Variables de Entorno en Railway
En el panel de Railway, ve a "Variables" y agrega:

```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE
JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET_HERE
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
CORS_ORIGIN=https://airportshuttletpa.com
```

### 2.3 Configurar Base de Datos
1. **Agregar servicio MongoDB** en Railway
2. **Copiar la URI** de conexión
3. **Pegar en MONGODB_URI**

---

## 📝 PASO 3: CONSTRUIR FRONTEND PARA PRODUCCIÓN

### 3.1 Configurar Variables
1. **Abrir** `airportshuttletpa-production.env`
2. **Cambiar** `tu-google-maps-api-key-aqui` por tu API key real
3. **Copiar** la URL del backend de Railway

### 3.2 Construir el Frontend
```bash
# En tu computadora, en la carpeta del proyecto:
npm install
npm run build
```

---

## 📝 PASO 4: SUBIR A IONOS

### 4.1 Acceder por SFTP
1. **Descargar FileZilla** (gratuito)
2. **Conectar** con:
   - Host: `access775092417.webspace-data.io`
   - Usuario: `u96636193`
   - Password: (tu password de Ionos)

### 4.2 Subir Archivos
1. **Navegar** a la carpeta `public_html`
2. **Subir** todo el contenido de la carpeta `build`
3. **Verificar** que `index.html` esté en la raíz

---

## 📝 PASO 5: CONFIGURAR DOMINIO

### 5.1 Verificar DNS
- Asegúrate de que `airportshuttletpa.com` apunte a Ionos
- Verifica que el SSL esté activo

### 5.2 Probar
1. **Visitar** https://airportshuttletpa.com
2. **Probar** hacer una reserva
3. **Verificar** que las APIs funcionen

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error 404:
- Verificar que los archivos estén en `public_html`
- Verificar que `index.html` esté en la raíz

### Error de API:
- Verificar que el backend esté corriendo en Railway
- Verificar las variables de entorno

### Error de Google Maps:
- Verificar que la API key sea correcta
- Verificar que el dominio esté autorizado

---

## 💰 COSTOS ESTIMADOS

- **Railway**: Gratuito (hasta cierto límite)
- **MongoDB**: Gratuito (hasta 512MB)
- **Ionos**: Ya lo tienes
- **Total**: $0/mes

---

## 📞 PRÓXIMOS PASOS

1. **¿Tienes cuenta en GitHub?** (Sí/No)
2. **¿Quieres que te ayude con Railway?** (Sí/No)
3. **¿Prefieres otra opción?** (Sí/No)

**Una vez que me confirmes, te guío paso a paso con capturas de pantalla! 🚀**
