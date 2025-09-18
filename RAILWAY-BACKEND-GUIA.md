# 🚀 GUÍA PASO A PASO: BACKEND EN RAILWAY

## 📋 INFORMACIÓN IMPORTANTE
- **Railway**: Servicio gratuito para hosting de aplicaciones
- **MongoDB**: Base de datos incluida gratuitamente
- **Tiempo estimado**: 15-20 minutos
- **Costo**: $0/mes (plan gratuito)

---

## 🎯 PASO 1: CREAR CUENTA EN RAILWAY

### 1.1 Ir a Railway
1. **Abrir navegador** y ir a: https://railway.app
2. **Hacer clic** en "Start a New Project"
3. **Seleccionar** "Deploy from GitHub repo"

### 1.2 Conectar GitHub
1. **Hacer clic** en "Connect GitHub"
2. **Autorizar** Railway para acceder a tu GitHub
3. **Seleccionar** tu cuenta de GitHub

---

## 🎯 PASO 2: PREPARAR REPOSITORIO EN GITHUB

### 2.1 Crear Repositorio (si no tienes uno)
1. **Ir a**: https://github.com
2. **Hacer clic** en "New repository"
3. **Nombre**: `airportshuttletpa-backend`
4. **Descripción**: "Backend para sistema de reservas aeroportuarias"
5. **Hacer clic** en "Create repository"

### 2.2 Subir Código del Backend
1. **Descargar** la carpeta `backend-admin` completa
2. **Comprimir** en un archivo ZIP
3. **Subir** al repositorio de GitHub
4. **Verificar** que tenga estos archivos:
   - `package.json`
   - `server.ts` (o `server.js`)
   - `src/` (carpeta con el código)
   - `railway.json` (que creé para ti)

---

## 🎯 PASO 3: DESPLEGAR EN RAILWAY

### 3.1 Conectar Repositorio
1. **En Railway**, hacer clic en "Deploy from GitHub repo"
2. **Seleccionar** el repositorio `airportshuttletpa-backend`
3. **Railway** detectará automáticamente que es Node.js

### 3.2 Configurar Variables de Entorno
1. **Hacer clic** en el proyecto creado
2. **Ir a** la pestaña "Variables"
3. **Agregar** estas variables una por una:

```
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/airportshuttletpa
JWT_SECRET=airportshuttletpa-jwt-secret-2024-super-seguro-railway
CORS_ORIGIN=https://airportshuttletpa.com
PORT=5001
NODE_ENV=production
```

### 3.3 Agregar Base de Datos MongoDB
1. **Hacer clic** en "New Service"
2. **Seleccionar** "Database" → "MongoDB"
3. **Railway** creará automáticamente la base de datos
4. **Copiar** la URI de conexión
5. **Pegar** en la variable `MONGODB_URI`

---

## 🎯 PASO 4: CONFIGURAR GOOGLE APIs

### 4.1 Variables de Google Calendar
Agregar en Railway:
```
GOOGLE_CLIENT_ID=tu-google-client-id-aqui
GOOGLE_CLIENT_SECRET=tu-google-client-secret-aqui
GOOGLE_REDIRECT_URI=https://airportshuttletpa.com/auth/google/callback
```

### 4.2 Variables de Email
Agregar en Railway:
```
EMAIL_HOST=smtp.ionos.com
EMAIL_PORT=587
EMAIL_USER=info@airportshuttletpa.com
EMAIL_PASS=tu-password-email-aqui
```

---

## 🎯 PASO 5: DESPLEGAR Y PROBAR

### 5.1 Iniciar Despliegue
1. **Railway** iniciará automáticamente el despliegue
2. **Esperar** 2-3 minutos para que termine
3. **Verificar** que el estado sea "Deployed"

### 5.2 Obtener URL del Backend
1. **Hacer clic** en el servicio del backend
2. **Copiar** la URL (ejemplo: `https://airportshuttletpa-backend.railway.app`)
3. **Probar** la URL en el navegador
4. **Debería** mostrar un mensaje de "API funcionando"

---

## 🎯 PASO 6: CONFIGURAR FRONTEND

### 6.1 Actualizar Configuración
1. **Abrir** el archivo `airportshuttletpa-production.env`
2. **Cambiar** la línea:
   ```
   REACT_APP_API_BASE_URL=https://airportshuttletpa-backend.railway.app/api
   ```
3. **Guardar** el archivo

### 6.2 Reconstruir Frontend
1. **En tu computadora**, ejecutar:
   ```bash
   npm run build
   ```
2. **Esperar** a que termine
3. **Los archivos** estarán listos en la carpeta `build`

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error de Despliegue:
- Verificar que `package.json` tenga el script `start`
- Verificar que todas las variables estén configuradas
- Revisar los logs en Railway

### Error de Base de Datos:
- Verificar que la URI de MongoDB sea correcta
- Verificar que la base de datos esté creada
- Revisar los logs de conexión

### Error de CORS:
- Verificar que `CORS_ORIGIN` sea `https://airportshuttletpa.com`
- Verificar que no tenga `/` al final

---

## 📞 PRÓXIMOS PASOS

Una vez que tengas el backend funcionando en Railway:

1. **Copiar** la URL del backend
2. **Actualizar** la configuración del frontend
3. **Reconstruir** el frontend
4. **Subir** a Ionos

---

## 💡 CONSEJOS IMPORTANTES

1. **Guarda** la URL del backend en un lugar seguro
2. **No compartas** las variables de entorno
3. **Prueba** cada paso antes de continuar
4. **Si algo falla**, revisa los logs en Railway

---

**¿Estás listo para empezar? ¡Vamos paso a paso! 🚀**
