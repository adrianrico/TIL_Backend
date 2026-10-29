# Despliegue en Render (Web Service, configuración manual)

| Campo | Valor |
|---|---|
| Runtime | Node (>= 20) |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

## Variables de entorno

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DB_TARGET` | `atlas` (obligatorio en producción) |
| `MONGO_URI_ATLAS` | URI `mongodb+srv://...` de Atlas (permitir la IP de Render en Network Access) |
| `DB_NAME` | `til_platform` |
| `JWT_ACCESS_SECRET` | >= 32 caracteres aleatorios |
| `JWT_REFRESH_SECRET` | >= 32 caracteres, distinto al anterior |
| `JWT_CLIENT_SECRET` | >= 32 caracteres, distinto a los dos anteriores |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` / `JWT_CLIENT_TTL` | `15m` / `7d` / `1h` |
| `CORS_ORIGINS` | URLs de los 4 frontends separadas por coma, sin `/` final ni `*` |

Generar un secreto: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

Ejemplo de `CORS_ORIGINS`:
`https://til-superadmin.onrender.com,https://til-forwarder.onrender.com,https://til-operator.onrender.com,https://til-tracker.onrender.com`

## Primer arranque
Crear el admin inicial una sola vez (Shell de Render, con `ADMIN_USERNAME` y `ADMIN_PASSWORD` definidos): `npm run seed:admin`.
Luego se pueden borrar esas dos variables.

## Notas
- El refresh token va en cookie `secure` + `sameSite=none`; requiere HTTPS en todos los frontends.
- Si el servicio se llama distinto a `til-backend`, actualizar `VITE_API_URL` en los frontends.
