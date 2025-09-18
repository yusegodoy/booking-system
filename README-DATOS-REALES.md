# 📊 Configuración del Backup con Datos Reales

Este backup ahora incluye los datos reales exportados de tu base de datos MongoDB local.

## 🗂️ Estructura de Datos

### Datos Exportados (17 de Septiembre, 2025)
- **📁 mongodb-export/**: Contiene todos los datos exportados de MongoDB
  - `vehicletypes.json`: 1 VehicleType (Minivan)
  - `users.json`: 2 usuarios del sistema
  - `customers.json`: 3 clientes registrados
  - `bookings.json`: 10 reservas existentes
  - `drivers.json`: 1 conductor
  - `vehicles.json`: 0 vehículos (normal)

### Scripts de Configuración
- **`restore-real-data.js`**: Script para restaurar los datos reales
- **`setup-with-real-data.bat`**: Script automático de configuración
- **`config-real-data.env`**: Archivo de configuración de ejemplo

## 🚀 Cómo Usar

### Opción 1: Configuración Automática
```bash
# Ejecutar desde C:\booking_backup
setup-with-real-data.bat
```

### Opción 2: Configuración Manual

1. **Configurar backend**:
   ```bash
   cd backend-admin
   copy ..\config-real-data.env .env
   npm install
   npm run build
   ```

2. **Configurar frontend**:
   ```bash
   copy config-real-data.env .env
   npm install
   ```

3. **Restaurar datos**:
   ```bash
   cd backend-admin
   node ../restore-real-data.js
   ```

4. **Iniciar servicios**:
   ```bash
   # Terminal 1: Backend
   cd backend-admin
   npm run dev
   
   # Terminal 2: Frontend
   npm start
   ```

## 📋 Datos Incluidos

### VehicleTypes
- **Minivan**: Configurado con precios por distancia, capacidad para 6 pasajeros

### Usuarios
- 2 usuarios del sistema administrativo

### Clientes
- 3 clientes registrados con información de contacto

### Reservas
- 10 reservas existentes con diferentes estados

### Conductores
- 1 conductor registrado en el sistema

## 🔧 Configuración de la Base de Datos

El backup está configurado para usar:
- **Base de datos**: `mongodb://localhost:27017/booking-admin`
- **Puerto backend**: `5001`
- **Puerto frontend**: `3000`

## ⚠️ Notas Importantes

1. **MongoDB debe estar corriendo** en tu máquina local
2. **Los datos se restauran completamente** - cualquier dato existente se eliminará
3. **Usa las credenciales originales** para iniciar sesión en el sistema
4. **Los datos son del 17 de septiembre, 2025** - pueden estar desactualizados

## 🆕 Actualizar Datos

Para actualizar los datos del backup:

1. Exporta nuevos datos desde tu MongoDB actual
2. Reemplaza los archivos en `mongodb-export/`
3. Ejecuta `restore-real-data.js` nuevamente

## 📞 Soporte

Si tienes problemas:
1. Verifica que MongoDB esté corriendo
2. Revisa los logs del backend
3. Asegúrate de que los puertos 3000 y 5001 estén libres
