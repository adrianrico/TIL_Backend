// Esquemas de validación del login de la otra web app.
import { z } from 'zod';

// Longitudes acotadas: evita payloads gigantes contra bcrypt
export const loginSchema = z.object({
  body: z
    .object({
      username: z.string().trim().min(1).max(40),
      password: z.string().min(1).max(128),
    })
    .strict(),
});
