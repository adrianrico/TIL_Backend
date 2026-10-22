// Valida body/query/params con un esquema zod: z.object({ body?, query?, params? }).
// Los datos limpios (campos desconocidos descartados) quedan en req.valid.
// Nota: en Express 5 req.query es de solo lectura, por eso no se reasigna.
import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) return next(result.error); // lo traduce errorHandler (400)
  req.valid = result.data;
  next();
};

export { z };
