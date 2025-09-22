# 🚀 Booking System - Web Application

## 📋 **Requisitos Previos**

Antes de usar la aplicación, asegúrate de tener instalado:

1. **Node.js** (versión 16 o superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`

2. **MongoDB**
   - Instalar MongoDB Community Server
   - O usar MongoDB Atlas (servicio en la nube)
   - O usar MongoDB Compass (interfaz gráfica)

3. **Git** (opcional, para clonar el repositorio)

## 🛠️ **Configuración Inicial (Primera vez)**

### Opción 1: Script Automático (Recomendado)
1. **Doble clic** en `setup-app.bat`
2. El script verificará todas las dependencias
3. Instalará los paquetes necesarios
4. Creará el archivo de configuración `.env`

### Opción 2: Configuración Manual
1. **Instalar dependencias del frontend:**
   ```bash
   npm install
   ```

2. **Instalar dependencias del backend:**
   ```bash
   cd backend-admin
   npm install
   ```

3. **Configurar variables de entorno:**
   - Crear archivo `backend-admin/.env`
   - Agregar las siguientes variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/booking-admin
   JWT_SECRET=your-secret-key-here
   PORT=5001
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
   ```

## 🚀 **Iniciar la Aplicación**

### Método Simple (Recomendado)
1. **Asegúrate de que MongoDB esté ejecutándose**
2. **Doble clic** en `start-app.bat`
3. El script:
   - Verificará que MongoDB esté corriendo
   - Liberará los puertos si están ocupados
   - Iniciará el servidor backend (puerto 5001)
   - Iniciará el servidor frontend (puerto 3000)
   - Abrirá automáticamente el navegador

### Método Manual
1. **Iniciar MongoDB:**
   - Abrir MongoDB Compass y conectar
   - O ejecutar `mongod` desde la línea de comandos

2. **Iniciar Backend:**
   ```bash
   cd backend-admin
   npm run dev
   ```

3. **Iniciar Frontend (nueva terminal):**
   ```bash
   npm start
   ```

4. **Abrir navegador:**
   - Ir a: http://localhost:3000

## 🔐 **Acceso a la Aplicación**

- **URL:** http://localhost:3000
- **Usuario:** admin@example.com
- **Contraseña:** (la que configuraste)

## 🛑 **Detener la Aplicación**

### Método Simple
- **Doble clic** en `stop-app.bat`
- Esto detendrá todos los servicios de Node.js

### Método Manual
- Presionar `Ctrl+C` en cada terminal
- O cerrar las ventanas de terminal

## 📁 **Estructura de Archivos**

```
booking3/
├── start-app.bat          # Iniciar aplicación
├── stop-app.bat           # Detener aplicación
├── setup-app.bat          # Configuración inicial
├── WEB_APP_README.md      # Este archivo
├── package.json           # Dependencias frontend
├── src/                   # Código frontend
└── backend-admin/         # Servidor backend
    ├── package.json       # Dependencias backend
    ├── .env              # Variables de entorno
    └── src/              # Código backend
```

## 🔧 **Solución de Problemas**

### Puerto 5001 ocupado
```bash
# Verificar qué proceso usa el puerto
netstat -ano | findstr :5001

# Terminar el proceso
taskkill /f /pid [PID]
```

### Puerto 3000 ocupado
```bash
# Verificar qué proceso usa el puerto
netstat -ano | findstr :3000

# Terminar el proceso
taskkill /f /pid [PID]
```

### MongoDB no conecta
1. Verificar que MongoDB esté ejecutándose
2. Verificar la URL en `.env`
3. Verificar que el puerto 27017 esté libre

### Errores de dependencias
```bash
# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 🌐 **Acceso desde otros dispositivos**

Para acceder desde otros dispositivos en la misma red:

1. **Encontrar tu IP local:**
   ```bash
   ipconfig
   ```

2. **Modificar el script start-app.bat:**
   - Cambiar `localhost` por tu IP local
   - Ejemplo: `192.168.1.100:3000`

3. **Acceder desde otros dispositivos:**
   - http://[TU-IP]:3000

## 📱 **Crear Acceso Directo en el Escritorio**

1. **Crear acceso directo a `start-app.bat`**
2. **Cambiar el icono** (opcional)
3. **Ejecutar como administrador** si hay problemas de permisos

## 🔄 **Actualizaciones**

Para actualizar la aplicación:

1. **Detener la aplicación** (`stop-app.bat`)
2. **Descargar nuevas versiones** del código
3. **Ejecutar `setup-app.bat`** para reinstalar dependencias
4. **Iniciar la aplicación** (`start-app.bat`)

## 📞 **Soporte**

Si tienes problemas:

1. **Verificar que todos los requisitos estén instalados**
2. **Revisar los logs en las ventanas de terminal**
3. **Ejecutar `setup-app.bat`** para verificar la configuración
4. **Verificar que MongoDB esté ejecutándose**

---

**¡Disfruta usando tu sistema de reservas! 🎉**
