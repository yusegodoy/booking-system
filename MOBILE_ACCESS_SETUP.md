# Configuración para Acceso Móvil

## Problema Resuelto
El wizard funcionaba en localhost pero no en dispositivos móviles conectados a la misma red.

## Cambios Realizados

### 1. Frontend (Wizard.tsx)
- ✅ Corregidas todas las URLs hardcodeadas `http://localhost:5001/api`
- ✅ Ahora usa variable de entorno `REACT_APP_API_BASE_URL`

### 2. Backend (server.ts)
- ✅ Actualizada configuración CORS para permitir acceso desde IP móvil
- ✅ Agregada `http://192.168.4.213:3000` a origins permitidos

### 3. Configuración (constants.ts)
- ✅ URL por defecto cambiada a `http://192.168.4.213:5001/api`

## Cómo Iniciar para Acceso Móvil

### Opción 1: Script Automático (Recomendado)
Usar el script PowerShell creado:
```powershell
.\start-mobile-access.ps1
```

### Opción 2: Script Batch
Usar el script batch:
```batch
start-mobile-access.bat
```

### Opción 3: Manual
1. **Iniciar Backend:**
   ```bash
   cd backend-admin
   npm run dev
   ```

2. **Iniciar Frontend:**
   ```bash
   npm start
   ```

## Verificación
1. ✅ Backend accesible: `http://192.168.4.213:5001`
2. ✅ Frontend accesible: `http://192.168.4.213:3000`
3. ✅ API de tipos de vehículos: `http://192.168.4.213:5001/api/vehicle-types`
4. ✅ CORS configurado correctamente

## Acceso desde Dispositivos Móviles
- **URL Principal:** `http://192.168.4.213:3000`
- **Admin Portal:** `http://192.168.4.213:3000` → Botón "Admin Portal"

## Configuración de Firewall (IMPORTANTE)

### Si el wizard no carga tipos de vehículos desde móvil/otra PC:

#### Opción 1: Script Automático (Recomendado)
```powershell
# Ejecutar como Administrador
.\configure-firewall.ps1
```

#### Opción 2: Script Batch
```batch
# Ejecutar como Administrador
configure-firewall.bat
```

#### Opción 3: Manual
1. Abrir PowerShell como **Administrador**
2. Ejecutar estos comandos:
```powershell
netsh advfirewall firewall add rule name="React App 3000" dir=in action=allow protocol=TCP localport=3000 remoteip=192.168.0.0/16
netsh advfirewall firewall add rule name="Node.js Backend 5001" dir=in action=allow protocol=TCP localport=5001 remoteip=192.168.0.0/16
```

## Diagnóstico
Para verificar la configuración:
```powershell
.\test-mobile-access.ps1
```

## Solución de Problemas
- **Firewall:** ⚠️ **CRÍTICO** - Windows Firewall bloquea conexiones externas por defecto
- **Red:** Asegurar que todos los dispositivos están en la misma red WiFi
- **IP Dinámica:** Si tu IP cambia, actualizar `src/config/constants.ts`
- **CORS:** Ya configurado correctamente en el backend

## Notas Importantes
- La IP `192.168.4.213` es específica para tu red actual
- Si cambias de red, ejecutar `ipconfig` para obtener la nueva IP
- Reiniciar ambos servidores después de cambios de configuración
