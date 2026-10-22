// Punto de arranque: conecta la base de datos, levanta HTTP y cierra limpio.
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './core/logger.js';

async function start() {
  await connectDB();
  const server = app.listen(env.PORT, () => logger.info(`API escuchando en puerto ${env.PORT} (${env.NODE_ENV})`));

  // Apagado limpio (Render envía SIGTERM al redeploy)
  const shutdown = (signal) => {
    logger.info(`${signal} recibido, cerrando...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref(); // forzar si tarda demasiado
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'No se pudo iniciar el servidor');
  process.exit(1);
});
