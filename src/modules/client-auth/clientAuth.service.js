// Autenticación de los usuarios TIL en la OTRA web app.
// Verifica la clave generada desde el panel y que el acceso esté permitido.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../core/errors/AppError.js';
import { TilUser } from '../til-users/tilUser.model.js';

export const CLIENT_ISSUER = 'til-backend';
export const CLIENT_AUDIENCE = 'til-client';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// Hash falso para igualar tiempos cuando el usuario no existe (anti enumeración)
const DUMMY_HASH = bcrypt.hashSync('til-dummy-password', 12);
const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');

// Datos mínimos que ve la otra app
const publicClient = (u) => ({ id: String(u._id), publicId: u.publicId, fullName: u.fullName });

export async function login(username, password) {
  const user = await TilUser.findOne({ 'access.username': username }).select(
    '+access.passwordHash +access.failedAttempts +access.lockUntil',
  );

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw invalidCredentials();
  }

  if (user.access.lockUntil && user.access.lockUntil > new Date()) {
    throw new AppError(423, 'ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente, intenta más tarde');
  }

  const ok = await bcrypt.compare(password, user.access.passwordHash);
  if (!ok) {
    user.access.failedAttempts += 1;
    if (user.access.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      user.access.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.access.failedAttempts = 0;
    }
    await user.save();
    throw invalidCredentials();
  }

  // La contraseña es correcta; solo ahora se revela si el acceso está restringido
  if (!user.access.enabled) {
    throw new AppError(403, 'ACCESS_RESTRICTED', 'Tu acceso está restringido');
  }

  user.access.failedAttempts = 0;
  user.access.lockUntil = null;
  user.access.lastLoginAt = new Date();
  await user.save();

  const accessToken = jwt.sign({}, env.JWT_CLIENT_SECRET, {
    algorithm: 'HS256',
    subject: String(user._id),
    issuer: CLIENT_ISSUER,
    audience: CLIENT_AUDIENCE,
    expiresIn: env.JWT_CLIENT_TTL,
  });

  return { accessToken, user: publicClient(user) };
}

// Revalida contra la BD: si se restringe o elimina al usuario, el token deja de servir
export async function getMe(userId) {
  const user = await TilUser.findById(userId);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Sesión inválida');
  if (!user.access.enabled) throw new AppError(403, 'ACCESS_RESTRICTED', 'Tu acceso está restringido');
  return publicClient(user);
}
