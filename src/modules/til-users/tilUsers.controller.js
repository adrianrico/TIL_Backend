// Controlador HTTP de til-users: sin lógica de negocio.
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import * as service from './tilUsers.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await service.list(req.valid.query));
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ data: await service.getById(req.valid.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await service.create(req.valid.body) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ data: await service.update(req.valid.params.id, req.valid.body) });
});

export const setAccess = asyncHandler(async (req, res) => {
  res.json({ data: await service.setAccess(req.valid.params.id, req.valid.body.enabled) });
});

// La respuesta incluye la clave en claro; nunca debe cachearse
export const generateCredentials = asyncHandler(async (req, res) => {
  const { user, credentials } = await service.generateCredentials(req.valid.params.id);
  res.set('Cache-Control', 'no-store');
  res.status(201).json({ data: user, credentials });
});

export const remove =asyncHandler(async (req, res) => {
  await service.remove(req.valid.params.id);
  res.status(204).end();
});
