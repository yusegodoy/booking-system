import { connectDB, disconnectDB } from '../config/database';
import { CompanyInfo } from '../models/CompanyInfo';
import fs from 'fs';
import path from 'path';

const checkLogo = async () => {
  await connectDB();

  try {
    const companyInfo = await CompanyInfo.findOne({ isActive: true });
    
    if (!companyInfo) {
      console.log('❌ No se encontró información de la compañía');
      return;
    }

    console.log('\n📋 Información de la compañía:');
    console.log(`   Nombre: ${companyInfo.companyName || 'N/A'}`);
    console.log(`   Logo URL en BD: ${companyInfo.logoUrl || 'N/A'}`);

    if (companyInfo.logoUrl) {
      // Verificar si el archivo existe físicamente
      const relativePath = companyInfo.logoUrl.startsWith('/')
        ? companyInfo.logoUrl.substring(1)
        : companyInfo.logoUrl;
      
      const logoPath = path.join(__dirname, '../../', relativePath);
      const exists = fs.existsSync(logoPath);
      
      console.log(`\n📁 Archivo físico:`);
      console.log(`   Ruta: ${logoPath}`);
      console.log(`   Existe: ${exists ? '✅ Sí' : '❌ No'}`);
      
      if (exists) {
        const stats = fs.statSync(logoPath);
        console.log(`   Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   Modificado: ${stats.mtime.toLocaleString()}`);
      }

      // Construir URLs para probar
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:5001';
      const apiUrl = `${baseUrl}/api/company-info/logo-image`;
      const staticUrl = `${baseUrl}${companyInfo.logoUrl}`;
      
      console.log(`\n🌐 URLs para probar en el navegador:`);
      console.log(`   1. Endpoint API: ${apiUrl}`);
      console.log(`   2. Archivo estático: ${staticUrl}`);
      console.log(`\n💡 Usa cualquiera de estas URLs en tu navegador para ver el logo`);
    } else {
      console.log('\n⚠️  No hay logo almacenado en la base de datos');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnectDB();
  }
};

checkLogo();

