import { Router } from 'express';
import { body } from 'express-validator';
import { UsersController } from '../controllers/users.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();
const ctrl = new UsersController();

router.post('/register', body('email').isEmail(), body('password').isLength({ min: 8 }), body('name').trim().notEmpty(), validate, ctrl.register);
router.post('/login', body('email').isEmail(), body('password').notEmpty(), validate, ctrl.login);
router.get('/me', authenticate, ctrl.me);
router.patch('/me', authenticate, body('name').optional().trim().notEmpty(), validate, ctrl.updateMe);

export default router;
