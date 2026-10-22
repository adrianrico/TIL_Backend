// Lógica de negocio de los usuarios TIL.
import bcrypt from 'bcryptjs';
import { AppError } from '../../core/errors/AppError.js';
import { generatePassword } from '../../core/utils/ids.js';
import { escapeRegex } from '../../core/utils/escapeRegex.js';
import { TilUser } from './tilUser.model.js';

const notFound = () => new AppError(404, 'USER_NOT_FOUND', 'Usuario no encontrado');

// Inicio y fin del día en UTC
const startOfDay = (d) => new Date(`${d}T00:00:00.000Z`);
const endOfDay = (d) => new Date(`${d}T23:59:59.999Z`);

// Campos por los que se puede ordenar (lista blanca)
const SORT_FIELDS = { fullName: 'fullName', registeredAt: 'registeredAt', access: 'access.enabled' };

export async function list(q) {
  const filter = {};

  if (q.search) filter.fullName = { $regex: escapeRegex(q.search), $options: 'i' };
  if (q.phone) filter.phone = { $regex: escapeRegex(q.phone.replace(/[\s\-().]/g, '')) };

  // Fecha individual (día completo) o rango; la individual tiene prioridad
  if (q.date) {
    filter.registeredAt = { $gte: startOfDay(q.date), $lte: endOfDay(q.date) };
  } else if (q.dateFrom || q.dateTo) {
    filter.registeredAt = {};
    if (q.dateFrom) filter.registeredAt.$gte = startOfDay(q.dateFrom);
    if (q.dateTo) filter.registeredAt.$lte = endOfDay(q.dateTo);
  }

  // Toggle de acceso
  if (q.access === 'allowed') filter['access.enabled'] = true;
  if (q.access === 'restricted') filter['access.enabled'] = false;

  const dir = q.order === 'asc' ? 1 : -1;
  const sort = { [SORT_FIELDS[q.sortBy]]: dir };
  if (q.sortBy !== 'registeredAt') sort.registeredAt = -1; // desempate estable

  const [data, total] = await Promise.all([
    TilUser.find(filter)
      .collation({ locale: 'es', strength: 2 }) // orden alfabético sin distinguir acentos/mayúsculas
      .sort(sort)
      .skip((q.page - 1) * q.limit)
      .limit(q.limit),
    TilUser.countDocuments(filter),
  ]);

  return { data, meta: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } };
}

export async function getById(id) {
  const user = await TilUser.findById(id);
  if (!user) throw notFound();
  return user;
}

export async function create({ fullName, phone }) {
  // publicId y registeredAt los asigna el modelo. Si (casi imposible) el ID
  // colisiona, se reintenta con uno nuevo.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await TilUser.create({ fullName, phone });
    } catch (err) {
      if (!(err.code === 11000 && err.keyPattern?.publicId)) throw err;
    }
  }
  throw new AppError(500, 'ID_GENERATION_FAILED', 'No se pudo generar un identificador único');
}

export async function update(id, changes) {
  const user = await TilUser.findByIdAndUpdate(id, { $set: changes }, { returnDocument: 'after', runValidators: true });
  if (!user) throw notFound();
  return user;
}

export async function setAccess(id, enabled) {
  const user = await TilUser.findByIdAndUpdate(id, { $set: { 'access.enabled': enabled } }, { returnDocument: 'after' });
  if (!user) throw notFound();
  return user;
}

// Genera (o regenera) las claves de acceso a la otra web app.
// El usuario de acceso es el publicId; la contraseña es aleatoria y se devuelve
// en claro UNA sola vez: en BD solo queda el hash. Regenerar invalida la anterior.
export async function generateCredentials(id) {
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await TilUser.findByIdAndUpdate(
    id,
    {
      $set: {
        'access.username': (await getById(id)).publicId,
        'access.passwordHash': passwordHash,
        'access.generatedAt': new Date(),
        'access.failedAttempts': 0,
        'access.lockUntil': null,
      },
    },
    { returnDocument: 'after' },
  );
  if (!user) throw notFound();

  return { user, credentials: { username: user.access.username, password } };
}

// Eliminación DEFINITIVA
export async function remove(id) {
  const { deletedCount } = await TilUser.deleteOne({ _id: id });
  if (!deletedCount) throw notFound();
}
