// Controlador HTTP de client-auth.
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../core/errors/AppError.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import * as service from './clientAuth.service.js';

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.valid.body;
  res.set('Cache-Control', 'no-store');
  res.json({ data: await service.login(username, password) });
});

// Middleware: exige token de CLIENTE (secreto y audiencia distintos a los de admin)
export function authenticateClient(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'UNAUTHORIZED', 'No autenticado'));
  try {
    const payload = jwt.verify(token, env.JWT_CLIENT_SECRET, {
      algorithms: ['HS256'],
      issuer: service.CLIENT_ISSUER,
      audience: service.CLIENT_AUDIENCE,
    });
    req.client = { id: payload.sub };
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Sesión inválida o expirada'));
  }
}

export const me = asyncHandler(async (req, res) => {
  res.json({ data: await service.getMe(req.client.id) });
});
