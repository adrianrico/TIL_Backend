// Carga usuarios de DEMOSTRACIÓN para probar la interfaz en local.
// Uso: npm run seed:demo           (reemplaza los de demo anteriores)
//      npm run seed:demo -- --clean (solo borra los de demo)
// Seguridad: se niega a correr fuera de la base local. Los usuarios de demo se
// reconocen por el prefijo de teléfono 555000 y no tienen claves de acceso.
import { connectDB, disconnectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { TilUser } from '../src/modules/til-users/tilUser.model.js';

if (env.isProd || env.DB_TARGET !== 'local') {
  console.error('seed:demo solo puede ejecutarse con DB_TARGET=local y fuera de producción.');
  process.exit(1);
}

const DEMO_PREFIX = '555000';
const NAMES = [
  'Ana Pérez', 'Ángel Ruiz', 'Beto Álvarez', 'Carlos Mendoza', 'Daniela Ortiz', 'Eduardo Núñez',
  'Fernanda López', 'Gabriel Soto', 'Hilda Ramírez', 'Iván Castillo', 'Julia Herrera', 'Karla Vega',
  'Luis Ñandú', 'María Fernández', 'Nicolás Reyes', 'Olga Torres', 'Pablo Guzmán', 'Quetzal Rojas',
  'Rosa Medina', 'Sergio Cruz', 'Tania Flores', 'Úrsula Navarro', 'Víctor Salinas', 'Ximena Prado',
];

await connectDB();

const removed = await TilUser.deleteMany({ phone: new RegExp(`^${DEMO_PREFIX}`) });
console.log(`Demo anteriores eliminados: ${removed.deletedCount}`);

if (!process.argv.includes('--clean')) {
  const DAY = 24 * 60 * 60 * 1000;
  for (const [i, fullName] of NAMES.entries()) {
    await TilUser.create({
      fullName,
      phone: `${DEMO_PREFIX}${String(1000 + i)}`,
      registeredAt: new Date(Date.now() - i * 3 * DAY), // repartidos en los últimos ~70 días
      access: { enabled: i % 3 !== 0 }, // mezcla de permitidos y restringidos
    });
  }
  console.log(`Usuarios de demo creados: ${NAMES.length}`);
}

await disconnectDB();
