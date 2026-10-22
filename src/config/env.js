// Lee y VALIDA las variables de entorno al arrancar.
// Si falta o es inválida alguna, el proceso termina: es preferible fallar al
// inicio que descubrir una configuración rota en producción.
import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    // Selector de base de datos: local (Studio3T) o atlas (producción)
    DB_TARGET: z.enum(['local', 'atlas']).default('local'),
    MONGO_URI_LOCAL: z.string().min(1).optional(),
    MONGO_URI_ATLAS: z.string().min(1).optional(),
    DB_NAME: z.string().min(1).default('til_platform'),

    // Secretos JWT: largos y distintos entre sí
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener >= 32 caracteres'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener >= 32 caracteres'),
    JWT_CLIENT_SECRET: z.string().min(32, 'JWT_CLIENT_SECRET debe tener >= 32 caracteres'),
    JWT_CLIENT_TTL: z.string().default('1h'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL: z.string().default('7d'),

    // Lista blanca de orígenes permitidos (separados por coma)
    CORS_ORIGINS: z.string().min(1),

    // Solo los usa scripts/seed-admin.js
    ADMIN_USERNAME: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    // La URI correspondiente al destino elegido es obligatoria
    const key = v.DB_TARGET === 'atlas' ? 'MONGO_URI_ATLAS' : 'MONGO_URI_LOCAL';
    if (!v[key]) ctx.addIssue({ code: 'custom', path: [key], message: `${key} es obligatoria con DB_TARGET=${v.DB_TARGET}` });

    if (v.JWT_ACCESS_SECRET === v.JWT_REFRESH_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_REFRESH_SECRET'], message: 'Debe ser distinto de JWT_ACCESS_SECRET' });
    }
    // El secreto de clientes debe ser independiente: un token de cliente nunca valida como admin
    if ([v.JWT_ACCESS_SECRET, v.JWT_REFRESH_SECRET].includes(v.JWT_CLIENT_SECRET)) {
      ctx.addIssue({ code: 'custom', path: ['JWT_CLIENT_SECRET'], message: 'Debe ser distinto de los secretos de admin' });
    }

    if (v.NODE_ENV === 'production') {
      // Protección: producción jamás debe apuntar a la base local
      if (v.DB_TARGET !== 'atlas') ctx.addIssue({ code: 'custom', path: ['DB_TARGET'], message: 'En producción DB_TARGET debe ser "atlas"' });
      if (v.CORS_ORIGINS.split(',').some((o) => o.trim() === '*')) {
        ctx.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'No se permite "*" en producción' });
      }
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
});
