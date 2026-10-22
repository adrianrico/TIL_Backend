// Manejador central de errores y 404. Siempre se monta al FINAL de app.js.
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { logger } from '../logger.js';

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Errores esperados de la aplicación
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  // Validación (zod)
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
    });
  }

  // JSON mal formado o cuerpo demasiado grande
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'JSON inválido' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Cuerpo demasiado grande' } });
  }

  // Errores de Mongoose / MongoDB
  if (err.code === 11000) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'El registro ya existe' } });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } });
  }

  // Cualquier otro: el detalle va al log; el cliente recibe un mensaje genérico
  logger.error({ err, reqId: req.id }, 'Error no controlado');
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
}
