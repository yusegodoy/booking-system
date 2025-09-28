import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-admin';

export const connectDB = async (): Promise<void> => {
  try {
    // Forzar el uso de la base de datos booking-admin si no está especificada
    let uri = MONGODB_URI;
    
    // Si la URI no especifica una base de datos (no contiene '/' al final del host), agregar booking-admin
    if (uri.includes('mongodb+srv://') && !uri.includes('/booking-admin') && !uri.includes('/test')) {
      // Insertar /booking-admin antes de los parámetros de query
      const queryStart = uri.indexOf('?');
      if (queryStart !== -1) {
        uri = uri.substring(0, queryStart) + '/booking-admin' + uri.substring(queryStart);
      } else {
        uri = uri + '/booking-admin';
      }
      console.log('🔧 Forcing database to booking-admin:', uri.replace(/\/\/.*@/, '//***:***@'));
    }
    
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.db?.databaseName}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.log('Continuing without database connection for testing...');
    // Don't exit for now, let the server start without DB
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}; 