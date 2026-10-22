// Rutas /api/v1/til-users. TODAS exigen sesión de administrador.
import { Router } from 'express';
import { authenticate, authorize } from '../../core/middlewares/authenticate.js';
import { validate } from '../../core/middlewares/validate.js';
import * as controller from './tilUsers.controller.js';
import { accessSchema, createSchema, idSchema, listSchema, updateSchema } from './tilUsers.schemas.js';

const router = Router();

router.use(authenticate, authorize('superadmin'));

router.get('/', validate(listSchema), controller.list);
router.post('/', validate(createSchema), controller.create);
router.get('/:id', validate(idSchema), controller.getOne);
router.patch('/:id', validate(updateSchema), controller.update);
router.patch('/:id/access', validate(accessSchema), controller.setAccess);
router.post('/:id/credentials', validate(idSchema), controller.generateCredentials);
router.delete('/:id', validate(idSchema), controller.remove);

export default router;
