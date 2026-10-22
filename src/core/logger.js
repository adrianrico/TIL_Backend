// Logger estructurado (pino). Oculta datos sensibles en cualquier log.
import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.isProd ? 'info' : 'debug',
  // Nunca registrar credenciales ni cookies
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
    ],
    censor: '[REDACTADO]',
  },
});
