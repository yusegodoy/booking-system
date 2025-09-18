// Script de inicio para Railway
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando backend para Railway...');

// Verificar que Node.js esté disponible
const nodeVersion = process.version;
console.log(`📦 Node.js version: ${nodeVersion}`);

// Verificar que las variables de entorno estén configuradas
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CORS_ORIGIN'
];

console.log('🔍 Verificando variables de entorno...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
  console.log('📝 Por favor configura estas variables en Railway:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  process.exit(1);
}

console.log('✅ Todas las variables de entorno están configuradas');

// Iniciar el servidor
console.log('🌐 Iniciando servidor...');
const server = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

server.on('close', (code) => {
  console.log(`🛑 Servidor terminado con código: ${code}`);
  process.exit(code);
});

server.on('error', (error) => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, terminando servidor...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, terminando servidor...');
  server.kill('SIGTERM');
});
