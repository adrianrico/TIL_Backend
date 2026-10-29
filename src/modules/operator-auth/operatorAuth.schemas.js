// Esquema de validación del login por CURP del operador.
import { z } from 'zod';

export const loginSchema = z.object({
  body: z
    .object({
      curp: z.string().trim().min(1).max(30),
    })
    .strict(),
});
