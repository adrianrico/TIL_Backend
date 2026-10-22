import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, API, CLIENT_HEADER, api, bearer, loginAdmin, setupDb, teardownDb } from './helpers.js';

beforeAll(setupDb);
afterAll(teardownDb);

describe('auth del administrador', () => {
  it('rechaza credenciales incorrectas con mensaje genérico', async () => {
    const res = await api().post(`${API}/auth/login`).send({ username: ADMIN.username, password: 'mala' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rechaza inyección de operadores NoSQL', async () => {
    const res = await api().post(`${API}/auth/login`).send({ username: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('login correcto devuelve token y cookie httpOnly', async () => {
    const res = await api().post(`${API}/auth/login`).send(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.headers['set-cookie'][0]).toMatch(/til_refresh=.*HttpOnly/i);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });

  it('/me exige token', async () => {
    expect((await api().get(`${API}/auth/me`)).status).toBe(401);
    const { token } = await loginAdmin();
    const res = await api().get(`${API}/auth/me`).set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(ADMIN.username);
  });

  it('refresh exige la cabecera X-Til-Client (defensa CSRF)', async () => {
    const { cookie } = await loginAdmin();
    const res = await api().post(`${API}/auth/refresh`).set('Cookie', cookie);
    expect(res.status).toBe(403);
  });

  it('refresh rota el token y detecta reutilización', async () => {
    const { cookie } = await loginAdmin();
    const first = await api().post(`${API}/auth/refresh`).set('Cookie', cookie).set(CLIENT_HEADER);
    expect(first.status).toBe(200);

    // Reusar el refresh ya rotado: se interpreta como robo
    const reuse = await api().post(`${API}/auth/refresh`).set('Cookie', cookie).set(CLIENT_HEADER);
    expect(reuse.status).toBe(401);

    // y la sesión legítima también queda revocada
    const revoked = await api().post(`${API}/auth/refresh`).set('Cookie', first.headers['set-cookie']).set(CLIENT_HEADER);
    expect(revoked.status).toBe(401);
  });

  it('logout revoca el refresh', async () => {
    const { cookie } = await loginAdmin();
    expect((await api().post(`${API}/auth/logout`).set('Cookie', cookie).set(CLIENT_HEADER)).status).toBe(204);
    expect((await api().post(`${API}/auth/refresh`).set('Cookie', cookie).set(CLIENT_HEADER)).status).toBe(401);
  });

  it('bloquea la cuenta tras 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i += 1) {
      await api().post(`${API}/auth/login`).send({ username: ADMIN.username, password: 'mala' });
    }
    const res = await api().post(`${API}/auth/login`).send(ADMIN); // incluso con la clave correcta
    expect(res.status).toBe(423);
  });
});
