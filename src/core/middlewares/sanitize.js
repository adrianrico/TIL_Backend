// Defensa contra inyección de operadores NoSQL (ej. {"$gt": ""}).
// Elimina, de forma recursiva y EN SITIO, las claves que empiezan con "$"
// o contienen "." en body, query y params.
const isDangerous = (key) => key.startsWith('$') || key.includes('.');

function clean(value) {
  if (Array.isArray(value)) {
    value.forEach(clean);
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (isDangerous(key)) delete value[key];
      else clean(value[key]);
    }
  }
  return value;
}

export function sanitize(req, res, next) {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
}
