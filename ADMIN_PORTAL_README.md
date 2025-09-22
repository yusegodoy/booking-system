# 🚗 Portal Administrativo - Sistema de Reservas de Transporte

## Descripción

El Portal Administrativo es una interfaz web completa para gestionar el sistema de reservas de transporte. Permite a los administradores ver todas las reservas, gestionar usuarios, y monitorear estadísticas del sistema.

## Características Principales

### 🔐 Autenticación Segura
- Login con email y contraseña
- Tokens JWT para sesiones seguras
- Protección de rutas administrativas

### 📊 Dashboard Principal
- Estadísticas en tiempo real
- Total de reservas
- Reservas pendientes
- Reservas completadas
- Ingresos totales
- Reservas recientes

### 📋 Gestión de Reservas
- Ver todas las reservas del sistema
- Filtrar por estado (pendiente, confirmada, completada, cancelada)
- Actualizar estado de reservas
- Información detallada de cada reserva
- Datos del cliente asociado

### 👥 Gestión de Usuarios
- Lista de todos los usuarios registrados
- Información de perfil de usuarios
- Roles de usuario (admin, user)

### ⚙️ Configuración del Sistema
- Panel de configuración general
- Ajustes del sistema

## Instalación y Configuración

### 1. Iniciar el Backend
```bash
cd backend-admin
npm install
npm run dev
```

El servidor se ejecutará en `http://localhost:5001`

### 2. Iniciar el Frontend
```bash
npm install
npm start
```

La aplicación se ejecutará en `http://localhost:3000`

### 3. Crear Usuario Administrador

**Opción A: Usando Postman**
- Método: POST
- URL: `http://localhost:5001/api/auth/create-default-admin`
- Headers: `Content-Type: application/json`
- Body: (vacío)

**Opción B: Usando curl**
```bash
curl -X POST http://localhost:5001/api/auth/create-default-admin
```

**Credenciales por defecto:**
- Email: `admin@booking.com`
- Password: `admin123`

## Uso del Portal

### 1. Acceso al Portal
- En la aplicación principal, haz clic en el botón "🚗 Admin Portal" (esquina inferior derecha)
- O navega directamente a la sección administrativa

### 2. Login
- Ingresa las credenciales de administrador
- El sistema validará tus credenciales y te redirigirá al dashboard

### 3. Navegación
- **Dashboard**: Estadísticas generales y reservas recientes
- **Reservations**: Gestión completa de todas las reservas
- **Users**: Lista de usuarios registrados
- **Settings**: Configuración del sistema

### 4. Gestión de Reservas
- Ver todas las reservas en una tabla organizada
- Filtrar por estado usando el selector
- Cambiar el estado de una reserva usando el dropdown en la columna "Actions"
- Ver información detallada del cliente y la ruta

### 5. Logout
- Haz clic en el botón "Logout" en la esquina superior derecha
- Serás redirigido a la aplicación principal

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/create-default-admin` - Crear admin por defecto
- `GET /api/auth/me` - Obtener información del usuario actual

### Reservas
- `GET /api/reservations` - Obtener todas las reservas
- `PATCH /api/reservations/:id` - Actualizar estado de reserva
- `GET /api/reservations/:id` - Obtener reserva específica

### Usuarios
- `GET /api/users` - Obtener todos los usuarios (solo admin)

## Estructura de Datos

### Reserva
```typescript
interface Reservation {
  _id: string;
  userId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  passengers: number;
  vehicleType: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}
```

### Usuario
```typescript
interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin: Date;
}
```

## Seguridad

- Todas las rutas administrativas requieren autenticación
- Los tokens JWT expiran en 24 horas
- Las contraseñas se hashean usando bcrypt
- Validación de roles para acceso a funciones administrativas

## Personalización

### Cambiar Credenciales por Defecto
Edita el archivo `.env` en el backend:
```env
ADMIN_EMAIL=YOUR_ADMIN_EMAIL_HERE
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD_HERE
```

### Modificar Estilos
Los estilos del portal están en `src/components/AdminPortal.css`

### Agregar Funcionalidades
- Nuevas pestañas en `AdminPortal.tsx`
- Nuevos endpoints en el backend
- Nuevos controladores según sea necesario

## Solución de Problemas

### Error de Conexión
- Verifica que el backend esté ejecutándose en el puerto 5001
- Verifica que MongoDB esté conectado
- Revisa los logs del servidor

### Error de Login
- Verifica que el usuario admin exista
- Usa el endpoint `/api/auth/create-default-admin` para crear el admin
- Verifica las credenciales

### Error de CORS
- Verifica que la URL del frontend esté configurada en el backend
- Revisa la configuración de CORS en `server.ts`

## Soporte

Para problemas técnicos o preguntas sobre el portal administrativo, revisa:
1. Los logs del servidor backend
2. La consola del navegador para errores del frontend
3. La documentación de la API
4. Los archivos de configuración 