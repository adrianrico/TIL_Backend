// Rutas /api/v1/operator-auth (consumidas por TIL_OPERATOR).
import { Router } from 'express';
import { clientLoginLimiter } from '../../core/middlewares/rateLimiters.js';
import { validate } from '../../core/middlewares/validate.js';
import * as controller from './operatorAuth.controller.js';
import { loginSchema } from './operatorAuth.schemas.js';

const router = Router();

router.post('/login', clientLoginLimiter, validate(loginSchema), controller.login);
router.get('/me', controller.authenticateOperator, controller.me);

export default router;
