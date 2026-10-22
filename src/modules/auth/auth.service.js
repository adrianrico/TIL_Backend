// Lógica de negocio de autenticación del administrador.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../core/errors/AppError.js';
import { ADMIN_AUDIENCE, ADMIN_ISSUER } from '../../core/middlewares/authenticate.js';
import { Admin } from './admin.model.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const REFRESH_AUDIENCE = 'til-admin-refresh';

// Hash falso para comparar cuando el usuario NO existe: así la respuesta tarda
// lo mismo y no se puede enumerar qué usuarios existen (timing attack).
const DUMMY_HASH = bcrypt.hashSync('til-dummy-password', 12);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');

// Emite el par de tokens y guarda el hash del jti del refresh vigente
async function issueTokens(admin) {
  const accessToken = jwt.sign({ role: admin.role }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: String(admin._id),
    issuer: ADMIN_ISSUER,
    audience: ADMIN_AUDIENCE,
    expiresIn: env.JWT_ACCESS_TTL,
  });

  const jti = crypto.randomUUID();
  const refreshToken = jwt.sign({}, env.JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    subject: String(admin._id),
    issuer: ADMIN_ISSUER,
    audience: REFRESH_AUDIENCE,
    expiresIn: env.JWT_REFRESH_TTL,
    jwtid: jti,
  });

  await Admin.updateOne({ _id: admin._id }, { refreshJtiHash: sha256(jti) });

  // Tiempo restante del refresh (ms) para la vida de la cookie
  const refreshMaxAgeMs = jwt.decode(refreshToken).exp * 1000 - Date.now();
  return { accessToken, refreshToken, refreshMaxAgeMs };
}

export async function login(username, password) {
  const admin = await Admin.findOne({ username }).select('+passwordHash');

  if (!admin) {
    await bcrypt.compare(password, DUMMY_HASH); // igualar tiempos
    throw invalidCredentials();
  }

  // Cuenta bloqueada temporalmente por intentos fallidos
  if (admin.lockUntil && admin.lockUntil > new Date()) {
    throw new AppError(423, 'ACCOUNT_LOCKED', 'Cuenta bloqueada temporalmente, intenta más tarde');
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    admin.failedAttempts += 1;
    if (admin.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      admin.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      admin.failedAttempts = 0;
    }
    await admin.save();
    throw invalidCredentials();
  }

  // Éxito: limpiar contadores
  admin.failedAttempts = 0;
  admin.lockUntil = null;
  admin.lastLoginAt = new Date();
  await admin.save();

  return { admin: publicAdmin(admin), ...(await issueTokens(admin)) };
}

// Rota el refresh token: el anterior queda invalidado. Si se detecta un token
// ya usado (posible robo) se revoca la sesión completa.
export async function refresh(refreshToken) {
  if (!refreshToken) throw new AppError(401, 'UNAUTHORIZED', 'Sesión inválida');

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer: ADMIN_ISSUER,
      audience: REFRESH_AUDIENCE,
    });
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Sesión inválida o expirada');
  }

  const admin = await Admin.findById(payload.sub).select('+refreshJtiHash');
  if (!admin) throw new AppError(401, 'UNAUTHORIZED', 'Sesión inválida');

  if (!admin.refreshJtiHash || admin.refreshJtiHash !== sha256(payload.jti)) {
    // Reutilización detectada -> revocar
    await Admin.updateOne({ _id: admin._id }, { refreshJtiHash: null });
    throw new AppError(401, 'UNAUTHORIZED', 'Sesión inválida');
  }

  return { admin: publicAdmin(admin), ...(await issueTokens(admin)) };
}

// Revoca la sesión (si el refresh es válido); nunca falla hacia el cliente
export async function logout(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer: ADMIN_ISSUER,
      audience: REFRESH_AUDIENCE,
    });
    await Admin.updateOne({ _id: payload.sub }, { refreshJtiHash: null });
  } catch {
    /* token ausente o inválido: nada que revocar */
  }
}

export async function getMe(adminId) {
  const admin = await Admin.findById(adminId);
  if (!admin) throw new AppError(401, 'UNAUTHORIZED', 'Sesión inválida');
  return publicAdmin(admin);
}

// Datos que sí se pueden exponer del administrador
const publicAdmin = (a) => ({ id: a._id, username: a.username, role: a.role, lastLoginAt: a.lastLoginAt });
