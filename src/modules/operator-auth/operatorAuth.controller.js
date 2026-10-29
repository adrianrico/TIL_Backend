// Controlador HTTP de operator-auth.
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../core/errors/AppError.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import * as service from './operatorAuth.service.js';

export const login = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ data: await service.login(req.valid.body.curp) });
});

// Middleware: exige token de OPERADOR (audiencia distinta a la de usuarios TIL)
export function authenticateOperator(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'UNAUTHORIZED', 'No autenticado'));
  try {
    const payload = jwt.verify(token, env.JWT_CLIENT_SECRET, {
      algorithms: ['HS256'],
      issuer: service.OPERATOR_ISSUER,
      audience: service.OPERATOR_AUDIENCE,
    });
    req.operatorCurp = payload.sub;
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Sesión inválida o expirada'));
  }
}

export const me = asyncHandler(async (req, res) => {
  res.json({ data: await service.getMe(req.operatorCurp) });
});
