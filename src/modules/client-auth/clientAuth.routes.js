// Rutas /api/v1/client-auth (consumidas por la otra web app).
import { Router } from 'express';
import { clientLoginLimiter } from '../../core/middlewares/rateLimiters.js';
import { validate } from '../../core/middlewares/validate.js';
import * as controller from './clientAuth.controller.js';
import { loginSchema } from './clientAuth.schemas.js';

const router = Router();

router.post('/login', clientLoginLimiter, validate(loginSchema), controller.login);
router.get('/me', controller.authenticateClient, controller.me);

export default router;
