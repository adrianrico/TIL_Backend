// Esquemas de validación del módulo auth.
import { z } from 'zod';

export const loginSchema = z.object({
  body: z
    .object({
      // Solo strings (descarta objetos tipo {"$gt": ""}) y con tope de longitud
      username: z.string().trim().min(1).max(64),
      password: z.string().min(1).max(128),
    })
    .strict(), // rechaza campos desconocidos
});
