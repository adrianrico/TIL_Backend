// Utilidades compartidas por las pruebas de integración.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Admin } from '../src/modules/auth/admin.model.js';
import { TilUser } from '../src/modules/til-users/tilUser.model.js';

export const API = '/api/v1';
export const ADMIN = { username: 'TEST_ADMIN', password: 'Test-Admin:pass.123' };
export const CLIENT_HEADER = { 'X-Til-Client': 'admin-panel' };

export const api = () => request(app);

// Conecta a la base de pruebas, la vacía y crea el administrador de prueba
export async function setupDb() {
  await connectDB();
  if (mongoose.connection.name !== 'til_platform_test') throw new Error('Las pruebas solo corren sobre til_platform_test');
  await Promise.all([Admin.deleteMany({}), TilUser.deleteMany({})]);
  await Admin.create({ username: ADMIN.username, passwordHash: await bcrypt.hash(ADMIN.password, 4) });
}

export async function teardownDb() {
  await Promise.all([Admin.deleteMany({}), TilUser.deleteMany({})]);
  await disconnectDB();
}

// Devuelve { token, cookie } de un login de administrador
export async function loginAdmin() {
  const res = await api().post(`${API}/auth/login`).send(ADMIN);
  return { token: res.body.data.accessToken, cookie: res.headers['set-cookie'] };
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
