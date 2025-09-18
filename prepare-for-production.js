// Script para preparar el proyecto para producción
const fs = require('fs');
const path = require('path');

console.log('🚀 PREPARANDO PROYECTO PARA PRODUCCIÓN...\n');

// Función para crear archivos de configuración
function createProductionFiles() {
  console.log('📁 Creando archivos de configuración...');
  
  // Crear package.json para producción
  const packageJson = {
    "name": "airport-shuttle-booking",
    "version": "1.0.0",
    "description": "Sistema de reservas de transporte aeroportuario",
    "main": "server.js",
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js",
      "build": "npm run build:frontend && npm run build:backend",
      "build:frontend": "cd frontend && npm run build",
      "build:backend": "echo 'Backend build complete'",
      "install:all": "npm install && cd backend-admin && npm install",
      "setup": "npm run install:all && npm run build"
    },
    "dependencies": {
      "express": "^4.18.2",
      "mongoose": "^7.5.0",
      "cors": "^2.8.5",
      "dotenv": "^16.3.1",
      "bcryptjs": "^2.4.3",
      "jsonwebtoken": "^9.0.2",
      "nodemailer": "^6.9.4",
      "multer": "^1.4.5-lts.1"
    },
    "engines": {
      "node": ">=16.0.0",
      "npm": ">=8.0.0"
    }
  };
  
  fs.writeFileSync('package-production.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ package-production.json creado');
  
  // Crear script de inicio
  const startScript = `#!/bin/bash
# Script de inicio para producción

echo "🚀 Iniciando sistema de reservas..."

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 16+"
    exit 1
fi

# Verificar que MongoDB esté corriendo
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB no está instalado. Asegúrate de tener MongoDB corriendo."
fi

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Iniciar el servidor
echo "🌐 Iniciando servidor en puerto 5001..."
node server.js
`;
  
  fs.writeFileSync('start-production.sh', startScript);
  console.log('✅ start-production.sh creado');
  
  // Crear archivo de configuración de Nginx (opcional)
  const nginxConfig = `# Configuración de Nginx para el sistema de reservas
# Colocar este archivo en /etc/nginx/sites-available/

server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Certificados SSL (configurar según tu proveedor)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Archivos estáticos del frontend
    location / {
        root /var/www/tu-dominio.com/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # API del backend
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Configuración de archivos estáticos
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`;
  
  fs.writeFileSync('nginx-config.conf', nginxConfig);
  console.log('✅ nginx-config.conf creado');
}

// Función para crear instrucciones de deployment
function createDeploymentInstructions() {
  const instructions = `# 📋 INSTRUCCIONES DE DEPLOYMENT EN IONOS

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
4. Instalar dependencias: \`npm install\`

## PASO 3: CONFIGURAR VARIABLES

1. Copiar \`production-config.env\` a \`.env\`
2. Cambiar todos los valores de ejemplo
3. Configurar dominio y APIs

## PASO 4: INICIAR SERVICIOS

1. Iniciar MongoDB
2. Iniciar el servidor: \`npm start\`
3. Configurar Nginx (opcional)
4. Configurar SSL

## PASO 5: PRUEBAS

1. Probar el frontend
2. Probar las APIs
3. Probar reservas
4. Verificar emails

## COMANDOS ÚTILES

\`\`\`bash
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
\`\`\`

## SOLUCIÓN DE PROBLEMAS

### Error de puerto ocupado:
\`sudo lsof -ti:5001 | xargs kill -9\`

### Error de MongoDB:
\`sudo systemctl start mongodb\`

### Error de permisos:
\`sudo chown -R www-data:www-data /var/www/\`
`;
  
  fs.writeFileSync('INSTRUCCIONES-DEPLOYMENT.md', instructions);
  console.log('✅ INSTRUCCIONES-DEPLOYMENT.md creado');
}

// Ejecutar funciones
try {
  createProductionFiles();
  createDeploymentInstructions();
  
  console.log('\n🎉 ¡PREPARACIÓN COMPLETADA!');
  console.log('\n📋 Archivos creados:');
  console.log('  • package-production.json');
  console.log('  • start-production.sh');
  console.log('  • nginx-config.conf');
  console.log('  • production-config.env');
  console.log('  • INSTRUCCIONES-DEPLOYMENT.md');
  console.log('  • deployment-guide.md');
  
  console.log('\n📖 Próximos pasos:');
  console.log('  1. Leer INSTRUCCIONES-DEPLOYMENT.md');
  console.log('  2. Configurar variables en production-config.env');
  console.log('  3. Seguir las instrucciones paso a paso');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
