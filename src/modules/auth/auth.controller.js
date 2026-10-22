// Controlador HTTP de auth: traduce req/res; la lógica vive en auth.service.js
import { env } from '../../config/env.js';
import { AppError } from '../../core/errors/AppError.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import * as service from './auth.service.js';

const COOKIE_NAME = 'til_refresh';
const COOKIE_PATH = '/api/v1/auth';

// Front y back viven en dominios distintos en Render => SameSite=None + Secure
const cookieOptions = (maxAge) => ({
  httpOnly: true, // JavaScript del navegador no puede leerla (anti XSS)
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  path: COOKIE_PATH,
  maxAge,
});

// Defensa CSRF adicional: refresh/logout exigen una cabecera personalizada,
// que un formulario cross-site no puede enviar (y CORS solo permite nuestro front).
export function requireClientHeader(req, res, next) {
  if (req.headers['x-til-client'] !== 'admin-panel') {
    return next(new AppError(403, 'FORBIDDEN', 'Petición no permitida'));
  }
  next();
}

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.valid.body;
  const { admin, accessToken, refreshToken, refreshMaxAgeMs } = await service.login(username, password);
  res.cookie(COOKIE_NAME, refreshToken, cookieOptions(refreshMaxAgeMs));
  res.json({ data: { accessToken, admin } });
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    const { admin, accessToken, refreshToken, refreshMaxAgeMs } = await service.refresh(req.cookies?.[COOKIE_NAME]);
    res.cookie(COOKIE_NAME, refreshToken, cookieOptions(refreshMaxAgeMs));
    res.json({ data: { accessToken, admin } });
  } catch (err) {
    // Sesión inválida: borrar la cookie para no reintentar con un token muerto
    res.clearCookie(COOKIE_NAME, cookieOptions(0));
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await service.logout(req.cookies?.[COOKIE_NAME]);
  res.clearCookie(COOKIE_NAME, cookieOptions(0));
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ data: await service.getMe(req.admin.id) });
});
