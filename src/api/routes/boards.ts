import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { BoardsController } from '../controllers/boards.controller';
import { authenticate } from '../../middleware/auth';
import { requireBoardAccess, requireBoardOwner } from '../../middleware/authorize';
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

// All routes below operate on a specific board — verify access first.
router.get('/:id', param('id').isUUID(), validate, requireBoardAccess, ctrl.getById);
router.patch(
  '/:id',
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('description').optional(),
  body('visibility').optional().isIn(['private', 'team', 'public']),
  body('wip_limit').optional().isInt({ min: 1 }),
  validate,
  requireBoardOwner,
  ctrl.update
);
router.delete('/:id', param('id').isUUID(), validate, requireBoardOwner, ctrl.remove);
router.get('/:id/members', param('id').isUUID(), validate, requireBoardAccess, ctrl.listMembers);
router.post(
  '/:id/members',
  param('id').isUUID(),
  body('user_id').isUUID(),
  validate,
  requireBoardOwner,
  ctrl.addMember
);
router.get(
  '/:id/activity',
  param('id').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  validate,
  requireBoardAccess,
  ctrl.activity
);

export default router;
