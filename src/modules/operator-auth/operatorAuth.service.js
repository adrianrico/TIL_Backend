// Autenticación de los OPERADORES (app TIL_OPERATOR): se identifican con su CURP,
// que debe existir embebido en algún transportista y estar disponible.
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../core/errors/AppError.js';
import { sanitizeCurp } from '../forwarder/domain/sanitizers.js';
import { transporterRepository } from '../forwarder/persistence/transporterRepository.js';

export const OPERATOR_ISSUER = 'til-backend';
export const OPERATOR_AUDIENCE = 'til-operator';

const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'CURP no registrada');

// Datos que ve la app del operador (sin RFC/NSS/licencia/domicilio)
const publicOperator = (op, transporter) => ({
  operator_id: op.operator_id,
  operator_curp: op.operator_curp ?? op.operator_id,
  operator_name: op.operator_name,
  transporter_id: transporter.transporter_id,
  transporter_name: transporter.transporter_name,
});

// Busca al operador por CURP y lo valida contra la BD (login y cada petición)
export async function findOperator(rawCurp) {
  const curp = sanitizeCurp(rawCurp);
  if (!curp) return null;
  const transporter = await transporterRepository.findByOperatorId(curp);
  const operator = transporter?.transporter_operators?.find((o) => o.operator_id === curp);
  if (!operator) return null;
  return { operator, transporter };
}

export async function login(rawCurp) {
  const found = await findOperator(rawCurp);
  if (!found) throw invalidCredentials();
  if (found.operator.operator_available === false) {
    throw new AppError(403, 'ACCESS_RESTRICTED', 'Tu acceso está restringido');
  }

  const accessToken = jwt.sign({}, env.JWT_CLIENT_SECRET, {
    algorithm: 'HS256',
    subject: found.operator.operator_id,
    issuer: OPERATOR_ISSUER,
    audience: OPERATOR_AUDIENCE,
    expiresIn: env.JWT_CLIENT_TTL,
  });

  return { accessToken, operator: publicOperator(found.operator, found.transporter) };
}

export async function getMe(curp) {
  const found = await findOperator(curp);
  if (!found) throw new AppError(401, 'UNAUTHORIZED', 'Sesión inválida');
  if (found.operator.operator_available === false) {
    throw new AppError(403, 'ACCESS_RESTRICTED', 'Tu acceso está restringido');
  }
  return publicOperator(found.operator, found.transporter);
}
