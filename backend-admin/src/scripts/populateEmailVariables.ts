import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EmailVariable, IEmailVariable } from '../models/EmailVariable';

// Cargar variables de entorno
dotenv.config();

const emailVariablesData: Partial<IEmailVariable>[] = [
  // Customer Information
  {
    category: 'Customer Information',
    variableName: 'firstName',
    codeField: 'booking.userData.firstName',
    description: 'Nombre del cliente',
    dataType: 'string',
    isRequired: true,
    exampleValue: 'Juan'
  },
  {
    category: 'Customer Information',
    variableName: 'lastName',
    codeField: 'booking.userData.lastName',
    description: 'Apellido del cliente',
    dataType: 'string',
    isRequired: true,
    exampleValue: 'Pérez'
  },
  {
    category: 'Customer Information',
    variableName: 'email',
    codeField: 'booking.userData.email',
    description: 'Email del cliente',
    dataType: 'string',
    isRequired: true,
    exampleValue: 'juan@example.com'
  },
  {
    category: 'Customer Information',
    variableName: 'phone',
    codeField: 'booking.userData.phone',
    description: 'Teléfono del cliente',
    dataType: 'string',
    isRequired: false,
    exampleValue: '+1 (555) 123-4567'
  },
  {
    category: 'Customer Information',
    variableName: 'specialInstructions',
    codeField: 'booking.userData.specialInstructions',
    description: 'Instrucciones especiales',
    dataType: 'string',
    isRequired: false,
    exampleValue: 'Esperar en la puerta principal'
  },

  // Trip Information
  {
    category: 'Trip Information',
    variableName: 'pickup',
    codeField: 'booking.tripInfo.pickup',
    description: 'Ubicación de recogida',
    dataType: 'string',
    isRequired: true,
    exampleValue: '123 Main St, Tampa, FL'
  },
  {
    category: 'Trip Information',
    variableName: 'dropoff',
    codeField: 'booking.tripInfo.dropoff',
    description: 'Ubicación de destino',
    dataType: 'string',
    isRequired: true,
    exampleValue: 'Tampa International Airport'
  },
  {
    category: 'Trip Information',
    variableName: 'pickupDate',
    codeField: 'booking.tripInfo.pickupDate',
    description: 'Fecha de recogida',
    dataType: 'date',
    isRequired: true,
    exampleValue: '2024-01-15'
  },
  {
    category: 'Trip Information',
    variableName: 'pickupTime',
    codeField: 'booking.tripInfo.pickupHour + \':\' + booking.tripInfo.pickupMinute + \' \' + booking.tripInfo.pickupPeriod',
    description: 'Hora de recogida',
    dataType: 'string',
    isRequired: true,
    exampleValue: '2:30 PM'
  },
  {
    category: 'Trip Information',
    variableName: 'passengers',
    codeField: 'booking.tripInfo.passengers',
    description: 'Número de pasajeros',
    dataType: 'number',
    isRequired: true,
    exampleValue: '4'
  },
  {
    category: 'Trip Information',
    variableName: 'flight',
    codeField: 'booking.tripInfo.flight',
    description: 'Número de vuelo',
    dataType: 'string',
    isRequired: false,
    exampleValue: 'AA1234'
  },

  // Vehicle Information
  {
    category: 'Vehicle Information',
    variableName: 'vehicleType',
    codeField: 'booking.vehicleType',
    description: 'Tipo de vehículo',
    dataType: 'string',
    isRequired: true,
    exampleValue: 'Sedan'
  },
  {
    category: 'Vehicle Information',
    variableName: 'assignedVehicle',
    codeField: 'booking.assignedVehicle',
    description: 'Vehículo específico asignado',
    dataType: 'string',
    isRequired: false,
    exampleValue: 'Toyota Camry - ABC123'
  },

  // Pricing & Payment
  {
    category: 'Pricing & Payment',
    variableName: 'totalPrice',
    codeField: 'booking.totalPrice',
    description: 'Precio total',
    dataType: 'number',
    isRequired: true,
    exampleValue: '$75.00'
  },
  {
    category: 'Pricing & Payment',
    variableName: 'paymentMethod',
    codeField: 'booking.paymentMethod',
    description: 'Método de pago',
    dataType: 'string',
    isRequired: false,
    exampleValue: 'Credit Card'
  },

  // Child Safety
  {
    category: 'Child Safety',
    variableName: 'infantSeats',
    codeField: 'booking.tripInfo.infantSeats',
    description: 'Asientos para bebés',
    dataType: 'number',
    isRequired: false,
    exampleValue: '1'
  },
  {
    category: 'Child Safety',
    variableName: 'toddlerSeats',
    codeField: 'booking.tripInfo.toddlerSeats',
    description: 'Asientos para niños',
    dataType: 'number',
    isRequired: false,
    exampleValue: '2'
  },
  {
    category: 'Child Safety',
    variableName: 'boosterSeats',
    codeField: 'booking.tripInfo.boosterSeats',
    description: 'Asientos elevadores',
    dataType: 'number',
    isRequired: false,
    exampleValue: '1'
  },

  // Driver Assignment
  {
    category: 'Driver Assignment',
    variableName: 'assignedDriver',
    codeField: 'booking.assignedDriver',
    description: 'Conductor asignado',
    dataType: 'string',
    isRequired: false,
    exampleValue: 'Carlos Mendez'
  },

  // Booking Details
  {
    category: 'Booking Details',
    variableName: 'confirmationNumber',
    codeField: 'booking.outboundConfirmationNumber',
    description: 'Número de confirmación',
    dataType: 'string',
    isRequired: true,
    exampleValue: 'AST-2024-001'
  },
  {
    category: 'Booking Details',
    variableName: 'bookingDate',
    codeField: 'new Date(booking.createdAt).toLocaleDateString()',
    description: 'Fecha de reserva',
    dataType: 'date',
    isRequired: false,
    exampleValue: '01/15/2024'
  },

  // Company Information
  {
    category: 'Company Information',
    variableName: 'companyName',
    codeField: 'companyInfo.companyName',
    description: 'Nombre de la empresa',
    dataType: 'string',
    isRequired: false,
    exampleValue: 'Airport Shuttle TPA'
  },
  {
    category: 'Company Information',
    variableName: 'companyPhone',
    codeField: 'companyInfo.companyPhone',
    description: 'Teléfono de la empresa',
    dataType: 'string',
    isRequired: false,
    exampleValue: '+1 (813) 555-0123'
  },
  {
    category: 'Company Information',
    variableName: 'companyEmail',
    codeField: 'companyInfo.companyEmail',
    description: 'Email de la empresa',
    dataType: 'string',
    isRequired: false,
    exampleValue: 'info@airportshuttletpa.com'
  }
];

async function populateEmailVariables() {
  try {
    console.log('🚀 Conectando a MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';
    await mongoose.connect(mongoUri);
    
    console.log('✅ Conectado a MongoDB');
    
    // Verificar si ya existen variables
    const existingCount = await EmailVariable.countDocuments();
    console.log(`📊 Variables existentes: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('⚠️  Ya existen variables en la base de datos');
      console.log('¿Deseas continuar y actualizar/agregar variables? (Ctrl+C para cancelar)');
      
      // Esperar 5 segundos para que el usuario pueda cancelar
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('📝 Insertando/actualizando variables de email...');
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const variableData of emailVariablesData) {
      const existingVariable = await EmailVariable.findOne({ 
        variableName: variableData.variableName 
      });
      
      if (existingVariable) {
        // Actualizar variable existente
        await EmailVariable.updateOne(
          { variableName: variableData.variableName },
          { $set: variableData }
        );
        updatedCount++;
        console.log(`🔄 Actualizada: ${variableData.variableName}`);
      } else {
        // Insertar nueva variable
        const newVariable = new EmailVariable(variableData);
        await newVariable.save();
        insertedCount++;
        console.log(`➕ Nueva: ${variableData.variableName}`);
      }
    }
    
    console.log('\n✅ Proceso completado:');
    console.log(`📊 Variables insertadas: ${insertedCount}`);
    console.log(`🔄 Variables actualizadas: ${updatedCount}`);
    console.log(`📈 Total procesadas: ${insertedCount + updatedCount}`);
    
    // Mostrar resumen por categoría
    console.log('\n📋 Resumen por categoría:');
    const categories = await EmailVariable.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    categories.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} variables`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  populateEmailVariables();
}

export { populateEmailVariables };

