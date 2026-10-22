import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { API, api, bearer, loginAdmin, setupDb, teardownDb } from './helpers.js';

let auth;
const post = (path, body) => api().post(`${API}${path}`).set(auth).send(body);
const get = (path) => api().get(`${API}${path}`).set(auth);

beforeAll(async () => {
  await setupDb();
  auth = bearer((await loginAdmin()).token);
});
afterAll(teardownDb);

describe('til-users', () => {
  it('exige sesión de administrador', async () => {
    expect((await api().get(`${API}/til-users`)).status).toBe(401);
  });

  it('crea con ID y fecha automáticos y normaliza el teléfono', async () => {
    const res = await post('/til-users', { fullName: '  Ana Pérez ', phone: '(55) 1234-5678' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ fullName: 'Ana Pérez', phone: '5512345678' });
    expect(res.body.data.publicId).toMatch(/^TIL-[A-Z0-9]{10}$/);
    expect(res.body.data.registeredAt).toBeTruthy();
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data._id).toBeUndefined();
  });

  it('mismo nombre y teléfono generan usuarios distintos', async () => {
    const a = await post('/til-users', { fullName: 'Gemelo Uno', phone: '5500000001' });
    const b = await post('/til-users', { fullName: 'Gemelo Uno', phone: '5500000001' });
    expect(b.status).toBe(201);
    expect(a.body.data.publicId).not.toBe(b.body.data.publicId);
  });

  it('rechaza campos que el cliente no debe controlar (mass assignment)', async () => {
    const res = await post('/til-users', { fullName: 'Hack', phone: '5512345678', registeredAt: '2000-01-01', publicId: 'X' });
    expect(res.status).toBe(400);
  });

  it('valida el teléfono', async () => {
    expect((await post('/til-users', { fullName: 'Zed', phone: 'abc' })).status).toBe(400);
  });

  it('toggle de acceso y filtros', async () => {
    const u = (await post('/til-users', { fullName: 'Con Acceso', phone: '5511110000' })).body.data;
    const res = await api().patch(`${API}/til-users/${u.id}/access`).set(auth).send({ enabled: true });
    expect(res.body.data.access.enabled).toBe(true);

    const allowed = await get('/til-users?access=allowed');
    expect(allowed.body.data.every((x) => x.access.enabled)).toBe(true);
    expect(allowed.body.meta.total).toBeGreaterThanOrEqual(1);
    const restricted = await get('/til-users?access=restricted');
    expect(restricted.body.data.every((x) => !x.access.enabled)).toBe(true);
  });

  it('el texto de búsqueda se escapa (no es regex)', async () => {
    expect((await get('/til-users?search=.*')).body.meta.total).toBe(0);
  });

  it('valida fechas y rangos', async () => {
    expect((await get('/til-users?dateFrom=2030-02-01&dateTo=2030-01-01')).status).toBe(400);
    expect((await get('/til-users?date=2026-02-31')).status).toBe(400);
    const today = new Date().toISOString().slice(0, 10);
    expect((await get(`/til-users?date=${today}`)).body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('pagina y ordena', async () => {
    const res = await get('/til-users?limit=2&page=1&sortBy=fullName&order=asc');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2 });
    expect((await get('/til-users?limit=1000')).status).toBe(400);
  });

  it('id inválido da 400 y elimina definitivamente', async () => {
    expect((await get('/til-users/xyz')).status).toBe(400);
    const u = (await post('/til-users', { fullName: 'Borrar Yo', phone: '5522223333' })).body.data;
    expect((await api().delete(`${API}/til-users/${u.id}`).set(auth)).status).toBe(204);
    expect((await api().delete(`${API}/til-users/${u.id}`).set(auth)).status).toBe(404);
  });
});
