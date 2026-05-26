import { Router } from 'express';
import { body, param } from 'express-validator';
import { BoardsController } from '../controllers/boards.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();
const ctrl = new BoardsController();

router.use(authenticate);

router.get('/', ctrl.list);
router.post(
  '/',
  body('name').trim().notEmpty(),
  body('visibility').optional().isIn(['private', 'team', 'public']),
  body('wip_limit').optional().isInt({ min: 1 }),
  validate,
  ctrl.create
);
router.get('/:id', param('id').isUUID(), validate, ctrl.getById);
router.patch(
  '/:id',
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  validate,
  ctrl.update
);
router.delete('/:id', param('id').isUUID(), validate, ctrl.remove);
router.get('/:id/members', param('id').isUUID(), validate, ctrl.listMembers);
router.post('/:id/members', param('id').isUUID(), body('user_id').isUUID(), validate, ctrl.addMember);

export default router;
