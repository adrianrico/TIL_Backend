// Rutas del módulo auth: /api/v1/auth/*
import { Router } from 'express';
import { authenticate } from '../../core/middlewares/authenticate.js';
import { loginLimiter } from '../../core/middlewares/rateLimiters.js';
import { validate } from '../../core/middlewares/validate.js';
import * as controller from './auth.controller.js';
import { loginSchema } from './auth.schemas.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/refresh', controller.requireClientHeader, controller.refresh);
router.post('/logout', controller.requireClientHeader, controller.logout);
router.get('/me', authenticate, controller.me);

export default router;
