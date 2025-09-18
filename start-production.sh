#!/bin/bash
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
