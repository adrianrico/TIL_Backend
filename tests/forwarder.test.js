import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '../src/modules/forwarder/persistence/models.js';
import { API, api, bearer, loginAdmin, setupDb, teardownDb } from './helpers.js';

let user;
let auth;
let clientAuth;

const setAccess = (enabled) => api().patch(`${API}/til-users/${user.id}/access`).set(auth).send({ enabled });

beforeAll(async () => {
  await setupDb();
  await Client.deleteMany({});
  auth = bearer((await loginAdmin()).token);
  user = (await api().post(`${API}/til-users`).set(auth).send({ fullName: 'Forwarder Prueba', phone: '5511112222' })).body.data;
  const creds = (await api().post(`${API}/til-users/${user.id}/credentials`).set(auth)).body.credentials;
  await setAccess(true);
  const login = await api().post(`${API}/client-auth/login`).send(creds);
  clientAuth = bearer(login.body.data.accessToken);
});
afterAll(async () => {
  await Client.deleteMany({});
  await teardownDb();
});

describe('módulo forwarder', () => {
  it('exige sesión de cliente', async () => {
    expect((await api().get(`${API}/clients/client/`)).status).toBe(401);
    // un token de administrador no sirve
    expect((await api().get(`${API}/clients/client/`).set(auth)).status).toBe(401);
  });

  it('lista vacía responde code 0', async () => {
    const res = await api().get(`${API}/clients/client/`).set(clientAuth);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('0');
  });

  it('crea, lista y elimina un cliente', async () => {
    const created = await api().post(`${API}/clients/client/`).set(clientAuth)
      .send({ client_name: 'ACME', client_phone: '5512345678', client_email: 'acme@example.com' });
    expect(created.status).toBe(200);
    expect(created.body.code).toBe('1');

    const list = await api().get(`${API}/clients/client/`).set(clientAuth);
    expect(list.body.clients_data).toHaveLength(1);
    const { client_id } = list.body.clients_data[0];

    const removed = await api().delete(`${API}/clients/client/`).set(clientAuth).send({ client_id });
    expect(removed.body.code).toBe('1');
  });

  it('rutas, transportistas y maniobras responden con el contrato histórico', async () => {
    expect((await api().get(`${API}/routes/route`).set(clientAuth)).body.code).toBe('0');
    expect((await api().get(`${API}/transporters/transporter/`).set(clientAuth)).body.code).toBe('0');
    expect((await api().get(`${API}/maneuvers/maneuver/`).set(clientAuth)).body.code).toBe('0');
    expect((await api().get(`${API}/maneuvers/stats/`).set(clientAuth)).body.code).toBe('1');
  });

  it('restringir al usuario corta el acceso de inmediato', async () => {
    await setAccess(false);
    const res = await api().get(`${API}/clients/client/`).set(clientAuth);
    expect(res.status).toBe(403);
    await setAccess(true);
  });
});
