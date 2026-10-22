import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { API, api, bearer, loginAdmin, setupDb, teardownDb } from './helpers.js';

let auth;
let user;
let creds;

const clientLogin = (body) => api().post(`${API}/client-auth/login`).send(body);
const setAccess = (enabled) => api().patch(`${API}/til-users/${user.id}/access`).set(auth).send({ enabled });
const generate = async () =>
  (await api().post(`${API}/til-users/${user.id}/credentials`).set(auth)).body.credentials;

beforeAll(async () => {
  await setupDb();
  auth = bearer((await loginAdmin()).token);
  user = (await api().post(`${API}/til-users`).set(auth).send({ fullName: 'Cliente Prueba', phone: '5599998888' })).body.data;
  creds = await generate();
});
afterAll(teardownDb);

describe('credenciales y client-auth', () => {
  it('generar claves exige administrador', async () => {
    expect((await api().post(`${API}/til-users/${user.id}/credentials`)).status).toBe(401);
  });

  it('la clave es aleatoria, el hash no se expone y la respuesta no se cachea', async () => {
    const res = await api().post(`${API}/til-users/${user.id}/credentials`).set(auth);
    expect(res.headers['cache-control']).toMatch(/no-store/);
    expect(res.body.credentials.password).toHaveLength(14);
    expect(JSON.stringify(res.body.data)).not.toMatch(/\$2[aby]\$/);
    creds = res.body.credentials;
  });

  it('un usuario restringido no entra aunque la clave sea correcta', async () => {
    const res = await clientLogin(creds);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCESS_RESTRICTED');
  });

  it('con acceso permitido entra y /me responde', async () => {
    await setAccess(true);
    const res = await clientLogin(creds);
    expect(res.status).toBe(200);
    const me = await api().get(`${API}/client-auth/me`).set(bearer(res.body.data.accessToken));
    expect(me.status).toBe(200);
    expect(me.body.data.publicId).toBe(user.publicId);
  });

  it('los tokens de cliente y de administrador no son intercambiables', async () => {
    const clientToken = (await clientLogin(creds)).body.data.accessToken;
    expect((await api().get(`${API}/til-users`).set(bearer(clientToken))).status).toBe(401);
    expect((await api().get(`${API}/client-auth/me`).set(auth)).status).toBe(401);
  });

  it('restringir revoca el acceso aunque el token siga vigente', async () => {
    const token = (await clientLogin(creds)).body.data.accessToken;
    await setAccess(false);
    expect((await api().get(`${API}/client-auth/me`).set(bearer(token))).status).toBe(403);
    await setAccess(true);
  });

  it('regenerar invalida la clave anterior', async () => {
    const old = creds;
    creds = await generate();
    expect((await clientLogin(old)).status).toBe(401);
    expect((await clientLogin(creds)).status).toBe(200);
  });

  it('usuario inexistente e inyección no revelan nada', async () => {
    expect((await clientLogin({ username: 'nadie', password: 'x' })).status).toBe(401);
    expect((await clientLogin({ username: { $gt: '' }, password: 'x' })).status).toBe(400);
  });

  it('bloquea tras 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i += 1) await clientLogin({ username: creds.username, password: 'mala' });
    expect((await clientLogin(creds)).status).toBe(423);
  });
});
