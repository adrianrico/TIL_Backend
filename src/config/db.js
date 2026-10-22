// Conexión a MongoDB con Mongoose. El destino (local/atlas) lo decide DB_TARGET.
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../core/logger.js';

export async function connectDB() {
  const uri = env.DB_TARGET === 'atlas' ? env.MONGO_URI_ATLAS : env.MONGO_URI_LOCAL;

  // Ignora filtros con campos no definidos en el esquema
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info(`MongoDB conectado (${env.DB_TARGET}, db=${env.DB_NAME})`));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB desconectado'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'Error de MongoDB'));

  await mongoose.connect(uri, {
    dbName: env.DB_NAME,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    // En producción los índices se gestionan de forma controlada
    autoIndex: !env.isProd,
  });
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
