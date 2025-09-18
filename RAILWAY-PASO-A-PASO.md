# 🚀 RAILWAY: PASO A PASO MUY SIMPLE

## 📋 ANTES DE EMPEZAR
- **Tiempo**: 15-20 minutos
- **Necesitas**: Cuenta de GitHub (gratuita)
- **Costo**: $0/mes

---

## 🎯 PASO 1: CREAR CUENTA EN RAILWAY (5 minutos)

### 1.1 Ir a Railway
1. **Abrir navegador** y ir a: https://railway.app
2. **Hacer clic** en "Start a New Project"
3. **Seleccionar** "Deploy from GitHub repo"

### 1.2 Conectar GitHub
1. **Hacer clic** en "Connect GitHub"
2. **Autorizar** Railway para acceder a tu GitHub
3. **Seleccionar** tu cuenta de GitHub

---

## 🎯 PASO 2: PREPARAR CÓDIGO EN GITHUB (5 minutos)

### 2.1 Crear Repositorio
1. **Ir a**: https://github.com
2. **Hacer clic** en "New repository"
3. **Nombre**: `airportshuttletpa-backend`
4. **Hacer clic** en "Create repository"

### 2.2 Subir Código
1. **Descargar** la carpeta `backend-admin` completa
2. **Comprimir** en ZIP
3. **Subir** al repositorio de GitHub

---

## 🎯 PASO 3: DESPLEGAR EN RAILWAY (5 minutos)

### 3.1 Conectar Repositorio
1. **En Railway**, hacer clic en "Deploy from GitHub repo"
2. **Seleccionar** el repositorio `airportshuttletpa-backend`
3. **Railway** detectará automáticamente que es Node.js

### 3.2 Configurar Variables
1. **Hacer clic** en el proyecto creado
2. **Ir a** la pestaña "Variables"
3. **Agregar** estas variables:

```
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/airportshuttletpa
JWT_SECRET=airportshuttletpa-jwt-secret-2024-super-seguro-railway
CORS_ORIGIN=https://airportshuttletpa.com
PORT=5001
NODE_ENV=production
```

### 3.3 Agregar Base de Datos
1. **Hacer clic** en "New Service"
2. **Seleccionar** "Database" → "MongoDB"
3. **Copiar** la URI de conexión
4. **Pegar** en la variable `MONGODB_URI`

---

## 🎯 PASO 4: PROBAR (5 minutos)

### 4.1 Verificar Despliegue
1. **Railway** iniciará automáticamente el despliegue
2. **Esperar** 2-3 minutos
3. **Hacer clic** en el servicio del backend
4. **Copiar** la URL (ejemplo: `https://airportshuttletpa-backend.railway.app`)

### 4.2 Probar API
1. **Abrir** la URL en el navegador
2. **Debería** mostrar un mensaje de "API funcionando"
3. **Si funciona**, ¡listo! 🎉

---

## 🆘 SI ALGO SALE MAL

### Error de Despliegue:
- Verificar que `package.json` esté en la raíz
- Verificar que todas las variables estén configuradas
- Revisar los logs en Railway

### Error de Base de Datos:
- Verificar que la URI de MongoDB sea correcta
- Verificar que la base de datos esté creada

### Error de CORS:
- Verificar que `CORS_ORIGIN` sea `https://airportshuttletpa.com`

---

## 📞 PRÓXIMOS PASOS

Una vez que tengas el backend funcionando:

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
