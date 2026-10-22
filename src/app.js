// Construye la aplicación Express. El ORDEN de los middlewares es importante.
import { randomUUID } from 'node:crypto';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { errorHandler, notFound } from './core/middlewares/errorHandler.js';
import { globalLimiter } from './core/middlewares/rateLimiters.js';
import { sanitize } from './core/middlewares/sanitize.js';
import { logger } from './core/logger.js';
import healthRoutes from './modules/health/health.routes.js';
import modulesRouter from './modules/index.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // Render está detrás de un proxy (IP real para rate limit)

// 1. Trazabilidad: ID por petición + logs HTTP
app.use(pinoHttp({ logger, genReqId: (req, res) => {
  const id = randomUUID();
  res.setHeader('X-Request-Id', id);
  return id;
} }));

// 2. Cabeceras de seguridad
app.use(helmet());

// 3. CORS con lista blanca (nunca "*" porque se usan cookies)
app.use(cors({
  origin: env.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

app.use(compression());

// 4. Health check (fuera del rate limit y de /api)
app.use('/health', healthRoutes);

// 5. Límite general + parseo de cuerpo con tope de tamaño
app.use(globalLimiter);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// 6. Sanitización NoSQL y parámetros duplicados
app.use(sanitize);
app.use(hpp());

// 7. Rutas versionadas
app.use('/api/v1', modulesRouter);

// 8. 404 y errores (siempre al final)
app.use(notFound);
app.use(errorHandler);
