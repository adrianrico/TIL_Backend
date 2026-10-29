// Límites de peticiones por IP (anti fuerza bruta y abuso).
import rateLimit from 'express-rate-limit';

const tooMany = (code, message) => ({ error: { code, message } });

// Límite general para toda la API
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('RATE_LIMITED', 'Demasiadas peticiones, intenta más tarde'),
});

// Límite ESTRICTO para el login de clientes (contador independiente del de admin)
export const clientLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('TOO_MANY_ATTEMPTS', 'Demasiados intentos, intenta más tarde'),
});

// Límite ESTRICTO para endpoints de login (los intentos exitosos no cuentan)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('TOO_MANY_ATTEMPTS', 'Demasiados intentos, intenta más tarde'),
});

// Límite de la consulta PÚBLICA por llave MONI (TIL_TRACKER): frena el barrido de llaves.
// Los intentos exitosos no cuentan, así el sondeo normal (1/min) nunca lo agota.
export const monitorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: tooMany('TOO_MANY_ATTEMPTS', 'Demasiados intentos, intenta más tarde'),
});
