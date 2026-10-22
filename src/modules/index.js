// Registro central de módulos de la API (/api/v1).
// Para integrar un proyecto nuevo: crear su carpeta en /modules y montarla aquí.
import { Router } from 'express';
import authRoutes from './auth/auth.routes.js';
import clientAuthRoutes from './client-auth/clientAuth.routes.js';
import tilUsersRoutes from './til-users/tilUsers.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/til-users', tilUsersRoutes);
router.use('/client-auth', clientAuthRoutes);

export default router;
