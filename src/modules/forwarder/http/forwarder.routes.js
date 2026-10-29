// Rutas del módulo forwarder: /api/v1/{clients,transporters,routes,maneuvers}.
// Conservan el contrato histórico del frontend ({ code: '1', ...datos }); los errores
// de negocio se responden como { code, message } (ver `legacyErrors`).
import { Router } from 'express';
import { authenticateClient } from '../../client-auth/clientAuth.controller.js';
import { monitorLimiter } from '../../../core/middlewares/rateLimiters.js';
import { AppError as TilAppError } from '../../../core/errors/AppError.js';
import { TilUser } from '../../til-users/tilUser.model.js';
import { authenticateOperator } from '../../operator-auth/operatorAuth.controller.js';
import * as operatorAuth from '../../operator-auth/operatorAuth.service.js';
import { asyncHandler } from '../../../core/utils/asyncHandler.js';
import logger from '../shared/logger.js';
import { AppError, badRequest } from '../shared/appError.js';
import { systemClock } from '../shared/clock.js';
import { clientRepository } from '../persistence/clientRepository.js';
import { maneuverRepository } from '../persistence/maneuverRepository.js';
import { routeRepository } from '../persistence/routeRepository.js';
import { transporterRepository } from '../persistence/transporterRepository.js';
import { createClientService } from '../application/clientService.js';
import { createManeuverService } from '../application/maneuverService.js';
import { createRouteService } from '../application/routeService.js';
import { createTransporterService } from '../application/transporterService.js';
import * as v from './validators.js';

const clock = systemClock;
const clientService = createClientService({ clientRepository, maneuverRepository, clock });
const routeService = createRouteService({ routeRepository });
const transporterService = createTransporterService({ transporterRepository, clock });
const maneuverService = createManeuverService({
  clientRepository, routeRepository, maneuverRepository, transporterRepository, clock,
});

// Guardia: token de cliente válido Y acceso todavía habilitado en BD, así el toggle
// del panel TIL_Superadmin surte efecto de inmediato (no hasta que expire el token).
const requireUser = [
  authenticateClient,
  asyncHandler(async (req, res, next) => {
    const user = await TilUser.findById(req.client.id).select('fullName access.enabled');
    if (!user) throw new TilAppError(401, 'UNAUTHORIZED', 'Sesión inválida');
    if (!user.access.enabled) throw new TilAppError(403, 'ACCESS_RESTRICTED', 'Tu acceso está restringido');
    req.actor = { type: 'admin', name: user.fullName, curp: null };
    next();
  }),
];

// Guardia de OPERADOR (TIL_OPERATOR): token de operador válido Y CURP todavía registrada y disponible.
const requireOperator = [
  authenticateOperator,
  asyncHandler(async (req, res, next) => {
    const found = await operatorAuth.findOperator(req.operatorCurp);
    if (!found) throw new TilAppError(401, 'UNAUTHORIZED', 'Sesión inválida');
    if (found.operator.operator_available === false) throw new TilAppError(403, 'ACCESS_RESTRICTED', 'Tu acceso está restringido');
    req.operator = { curp: found.operator.operator_id, name: found.operator.operator_name };
    req.actor = { type: 'operator', name: found.operator.operator_name, curp: found.operator.operator_id };
    next();
  }),
];

// Acepta token de operador o de usuario TIL (el que llegue; se distingue por la audiencia).
const requireOperatorOrUser = (req, res, next) => {
  const chain = isOperatorToken(req) ? requireOperator : requireUser;
  let i = 0;
  const step = (err) => {
    if (err || i >= chain.length) return next(err);
    chain[i++](req, res, step);
  };
  step();
};

function isOperatorToken(req) {
  try {
    const token = (req.headers.authorization || '').split(' ')[1];
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.aud === operatorAuth.OPERATOR_AUDIENCE;
  } catch {
    return false;
  }
}

const ok = (res, body) => res.status(200).send({ code: '1', ...body });

// ── /clients ────────────────────────────────────────────────────────────────
export const clientsRouter = Router();
clientsRouter.use(requireUser);
clientsRouter.post('/client/', asyncHandler(async (req, res) => {
  ok(res, await clientService.handleClient(v.clientDto(req)));
}));
clientsRouter.get('/client/', asyncHandler(async (req, res) => {
  const clients_data = await clientService.listClients();
  if (clients_data.length === 0) return res.send({ code: '0', message: 'No hay clientes registrados todavía.' });
  ok(res, { clients_data });
}));
clientsRouter.delete('/client/', asyncHandler(async (req, res) => {
  ok(res, await clientService.deleteClient(v.clientDeleteDto(req)));
}));

// ── /transporters ───────────────────────────────────────────────────────────
export const transportersRouter = Router();
transportersRouter.use(requireUser);
transportersRouter.post('/transporter/', asyncHandler(async (req, res) => {
  ok(res, await transporterService.handleTransporter(v.transporterDto(req)));
}));
transportersRouter.post('/operator/', asyncHandler(async (req, res) => {
  ok(res, await transporterService.handleOperator(v.operatorDto(req)));
}));
transportersRouter.post('/eco/', asyncHandler(async (req, res) => {
  ok(res, await transporterService.handleEco(v.ecoDto(req)));
}));
transportersRouter.get('/transporter/', asyncHandler(async (req, res) => {
  const transporters_data = await transporterService.listTransporters();
  if (transporters_data.length === 0) return res.send({ code: '0', message: 'No hay transportistas registrados todavía.' });
  ok(res, { transporters_data });
}));
transportersRouter.delete('/transporter/', asyncHandler(async (req, res) => {
  ok(res, await transporterService.deleteTransporter(v.transporterDeleteDto(req)));
}));

// ── /routes ─────────────────────────────────────────────────────────────────
export const routesRouter = Router();
routesRouter.get('/route', requireOperatorOrUser, asyncHandler(async (req, res) => {
  const routes_data = await routeService.listRoutes();
  if (routes_data.length === 0) return res.send({ code: '0', message: 'No hay rutas registradas todavía.' });
  ok(res, { routes_data });
}));
routesRouter.post('/route', requireUser, asyncHandler(async (req, res) => {
  const result = await routeService.handleRoute(v.routeDto(req));
  // Contrato histórico: el alta responde code '1' (texto) y route_id; la edición, code 1 (número).
  if (result.created) return ok(res, { message: result.message, route_id: result.route_id });
  res.send({ code: 1, message: result.message });
}));
routesRouter.delete('/route/', requireUser, asyncHandler(async (req, res) => {
  ok(res, await routeService.deleteRoute(v.routeDeleteDto(req)));
}));

// ── /maneuvers ──────────────────────────────────────────────────────────────
export const maneuversRouter = Router();
// Consulta PÚBLICA de solo lectura por llave MONI (TIL_TRACKER): sin sesión, con límite propio.
// Llave inválida o sin maniobras -> 400 (el front la borra); 429 lo emite el limitador.
maneuversRouter.get('/monitor/', monitorLimiter, asyncHandler(async (req, res) => {
  const key = v.moniKeyDto(req);
  if (!key) throw badRequest('Llave no válida.');
  const maneuvers_data = await maneuverService.listByMoniKey(key);
  if (maneuvers_data.length === 0) throw badRequest('Llave no válida.');
  ok(res, { maneuvers_data });
}));
maneuversRouter.get('/byOperator/', requireOperator, asyncHandler(async (req, res) => {
  const maneuvers_data = await maneuverService.listByOperator(req.operator);
  if (maneuvers_data.length === 0) return res.send({ code: '0', message: 'No tienes maniobras asignadas.', maneuvers_data });
  ok(res, { maneuvers_data });
}));
maneuversRouter.patch('/updateLocation/', requireOperatorOrUser, asyncHandler(async (req, res) => {
  const { message, man_progress } = await maneuverService.updateLocation(v.updateLocationDto(req), req.actor);
  ok(res, { message, man_progress });
}));
maneuversRouter.get('/maneuver/', requireUser, asyncHandler(async (req, res) => {
  const { maneuvers_data, pagination } = await maneuverService.listManeuvers(v.pagingDto(req));
  if (pagination.total === 0) {
    return res.send({ code: '0', message: 'No hay maniobras registradas todavía.', maneuvers_data, pagination });
  }
  ok(res, { maneuvers_data, pagination });
}));
maneuversRouter.post('/maneuver/', requireUser, asyncHandler(async (req, res) => {
  ok(res, await maneuverService.handleManeuver(v.maneuverDto(req)));
}));
maneuversRouter.delete('/maneuver/', requireUser, asyncHandler(async (req, res) => {
  ok(res, await maneuverService.deleteManeuver(v.maneuverDeleteDto(req)));
}));
maneuversRouter.get('/stats/', requireUser, asyncHandler(async (req, res) => {
  const range = v.statsDto(req);
  if (range.error) throw badRequest(range.error);
  ok(res, { stats: await maneuverService.getStats(range) });
}));

// Errores de negocio del módulo con el contrato histórico { code, message }.
// Cualquier otro error pasa al errorHandler global de TIL_Backend.
// eslint-disable-next-line no-unused-vars
export function legacyErrors(err, req, res, next) {
  if (err instanceof AppError) return res.status(err.status).json({ code: err.code, message: err.message });
  if (err instanceof TilAppError) return next(err);
  logger.error('forwarder', `${req.method} ${req.path} -> ${err.message}`);
  return res.status(500).json({ code: '-1', message: 'Error al procesar los datos en el servidor.' });
}

for (const r of [clientsRouter, transportersRouter, routesRouter, maneuversRouter]) r.use(legacyErrors);
