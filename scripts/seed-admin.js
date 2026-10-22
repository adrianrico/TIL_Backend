// Crea o actualiza el administrador con la contraseña HASHEADA.
// Uso: npm run seed:admin   (lee ADMIN_USERNAME y ADMIN_PASSWORD del entorno)
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Admin } from '../src/modules/auth/admin.model.js';

const { ADMIN_USERNAME, ADMIN_PASSWORD } = env;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('Define ADMIN_USERNAME y ADMIN_PASSWORD en el entorno (.env).');
  process.exit(1);
}

await connectDB();

// Guardamos solo el hash (bcrypt, costo 12); y reiniciamos bloqueos y sesiones
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
await Admin.findOneAndUpdate(
  { username: ADMIN_USERNAME },
  { username: ADMIN_USERNAME, passwordHash, role: 'superadmin', failedAttempts: 0, lockUntil: null, refreshJtiHash: null },
  { upsert: true, setDefaultsOnInsert: true },
);

console.log(`Administrador "${ADMIN_USERNAME}" listo en ${env.DB_TARGET}/${env.DB_NAME}.`);
await disconnectDB();
