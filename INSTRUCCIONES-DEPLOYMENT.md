# 📋 INSTRUCCIONES DE DEPLOYMENT EN IONOS

## PASO 1: PREPARAR EL SERVIDOR

### Si tienes VPS o Servidor Dedicado:
1. Conectar por SSH al servidor
2. Instalar Node.js 16+ y npm
3. Instalar MongoDB
4. Configurar firewall (puertos 80, 443, 5001)

### Si tienes Hosting Compartido:
1. Verificar que soporte Node.js
2. Crear base de datos MongoDB
3. Subir archivos por FTP

## PASO 2: SUBIR ARCHIVOS

1. Comprimir la carpeta del proyecto
2. Subir al servidor
3. Descomprimir en la carpeta web
4. Instalar dependencias: `npm install`

## PASO 3: CONFIGURAR VARIABLES

1. Copiar `production-config.env` a `.env`
2. Cambiar todos los valores de ejemplo
3. Configurar dominio y APIs

## PASO 4: INICIAR SERVICIOS

1. Iniciar MongoDB
2. Iniciar el servidor: `npm start`
3. Configurar Nginx (opcional)
4. Configurar SSL

## PASO 5: PRUEBAS

1. Probar el frontend
2. Probar las APIs
3. Probar reservas
4. Verificar emails

## COMANDOS ÚTILES

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev

# Iniciar en producción
npm start

# Ver logs
tail -f logs/app.log

# Reiniciar servicios
sudo systemctl restart nginx
sudo systemctl restart mongodb
```

## SOLUCIÓN DE PROBLEMAS

### Error de puerto ocupado:
`sudo lsof -ti:5001 | xargs kill -9`

### Error de MongoDB:
`sudo systemctl start mongodb`

### Error de permisos:
`sudo chown -R www-data:www-data /var/www/`
