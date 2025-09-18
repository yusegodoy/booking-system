# ✅ CHECKLIST RAILWAY - PASO A PASO

## 📋 ANTES DE EMPEZAR
- [ ] Tener cuenta en GitHub (gratuita)
- [ ] Tener la carpeta `backend-admin` descargada
- [ ] Tener 20 minutos libres

---

## 🎯 PASO 1: CREAR CUENTA EN RAILWAY
- [ ] Ir a https://railway.app
- [ ] Hacer clic en "Start a New Project"
- [ ] Hacer clic en "Deploy from GitHub repo"
- [ ] Conectar con GitHub
- [ ] Autorizar Railway

**⏱️ Tiempo: 2 minutos**

---

## 🎯 PASO 2: PREPARAR CÓDIGO EN GITHUB
- [ ] Ir a https://github.com
- [ ] Crear nuevo repositorio: `airportshuttletpa-backend`
- [ ] Descargar carpeta `backend-admin`
- [ ] Comprimir en ZIP
- [ ] Subir a GitHub

**⏱️ Tiempo: 5 minutos**

---

## 🎯 PASO 3: CONECTAR CON RAILWAY
- [ ] Volver a Railway
- [ ] Seleccionar repositorio `airportshuttletpa-backend`
- [ ] Railway detecta Node.js automáticamente
- [ ] Esperar a que termine el despliegue

**⏱️ Tiempo: 3 minutos**

---

## 🎯 PASO 4: CONFIGURAR VARIABLES
- [ ] Ir a pestaña "Variables"
- [ ] Agregar variable: `MONGODB_URI` = `mongodb+srv://usuario:password@cluster.mongodb.net/airportshuttletpa`
- [ ] Agregar variable: `JWT_SECRET` = `airportshuttletpa-jwt-secret-2024-super-seguro-railway`
- [ ] Agregar variable: `CORS_ORIGIN` = `https://airportshuttletpa.com`
- [ ] Agregar variable: `PORT` = `5001`
- [ ] Agregar variable: `NODE_ENV` = `production`

**⏱️ Tiempo: 5 minutos**

---

## 🎯 PASO 5: AGREGAR BASE DE DATOS
- [ ] Hacer clic en "New Service"
- [ ] Seleccionar "Database" → "MongoDB"
- [ ] Copiar URI de conexión
- [ ] Actualizar variable `MONGODB_URI` con la URI real

**⏱️ Tiempo: 3 minutos**

---

## 🎯 PASO 6: PROBAR
- [ ] Hacer clic en el servicio del backend
- [ ] Copiar la URL del backend
- [ ] Abrir URL en navegador
- [ ] Verificar que muestre "API funcionando"

**⏱️ Tiempo: 2 minutos**

---

## 🎉 ¡LISTO!
- [ ] Backend funcionando en Railway
- [ ] URL del backend guardada
- [ ] Variables configuradas
- [ ] Base de datos conectada

**⏱️ Tiempo total: 20 minutos**

---

## 📞 PRÓXIMOS PASOS
1. **Copiar** URL del backend
2. **Actualizar** configuración del frontend
3. **Reconstruir** frontend
4. **Subir** a Ionos

---

## 🆘 SI ALGO SALE MAL
- **Error de despliegue**: Verificar `package.json`
- **Error de base de datos**: Verificar URI de MongoDB
- **Error de CORS**: Verificar `CORS_ORIGIN`

---

**¿Estás listo para empezar? ¡Vamos paso a paso! 🚀**
