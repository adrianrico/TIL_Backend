// Esquemas de validación del módulo til-users.
import { z } from 'zod';

// Teléfono: se limpian espacios, guiones y paréntesis; queda "+" opcional y 7-15 dígitos
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-().]/g, ''))
  .pipe(z.string().regex(/^\+?\d{7,15}$/, 'Teléfono inválido (7 a 15 dígitos)'));

const fullName = z.string().trim().min(2, 'Mínimo 2 caracteres').max(120);

// Fecha YYYY-MM-DD real (rechaza 2026-02-31)
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')
  .refine((v) => new Date(`${v}T00:00:00.000Z`).toISOString().startsWith(v), 'Fecha inexistente');

// :id debe ser un ObjectId de Mongo (24 hex)
const params = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'ID inválido') });

export const listSchema = z.object({
  query: z
    .object({
      search: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(20).optional(),
      date: isoDate.optional(),
      dateFrom: isoDate.optional(),
      dateTo: isoDate.optional(),
      access: z.enum(['all', 'allowed', 'restricted']).default('all'),
      sortBy: z.enum(['fullName', 'registeredAt', 'access']).default('registeredAt'),
      order: z.enum(['asc', 'desc']).default('desc'),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .refine((q) => !q.dateFrom || !q.dateTo || q.dateFrom <= q.dateTo, {
      message: 'dateFrom no puede ser posterior a dateTo',
      path: ['dateFrom'],
    }),
});

// .strict(): rechaza campos extra (publicId, registeredAt, access...) => anti mass-assignment
export const createSchema = z.object({ body: z.object({ fullName, phone }).strict() });

export const updateSchema = z.object({
  params,
  body: z
    .object({ fullName: fullName.optional(), phone: phone.optional() })
    .strict()
    .refine((b) => Object.keys(b).length > 0, 'Envía al menos un campo'),
});

export const accessSchema = z.object({ params, body: z.object({ enabled: z.boolean() }).strict() });

export const idSchema = z.object({ params });
