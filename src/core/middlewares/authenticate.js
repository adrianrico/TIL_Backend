// Protege rutas: exige un access token de administrador válido.
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';

export const ADMIN_ISSUER = 'til-backend';
export const ADMIN_AUDIENCE = 'til-admin';

export function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'UNAUTHORIZED', 'No autenticado'));

  try {
    // Algoritmo, emisor y audiencia fijados: evita tokens forjados o de otro tipo
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: ADMIN_ISSUER,
      audience: ADMIN_AUDIENCE,
    });
    req.admin = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Sesión inválida o expirada'));
  }
}

// Control de roles (RBAC) para futuros perfiles: authorize('superadmin')
export const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.admin?.role) ? next() : next(new AppError(403, 'FORBIDDEN', 'Sin permisos'));
