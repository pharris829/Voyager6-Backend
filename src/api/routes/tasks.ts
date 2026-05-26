import { Router } from 'express';
import { body, param } from 'express-validator';
import { TasksController } from '../controllers/tasks.controller';
import { authenticate } from '../../middleware/auth';
import { requireBoardAccess, requireTaskBoardAccess } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';

const router = Router();
const ctrl = new TasksController();

router.use(authenticate);

// Board-scoped task routes — verify board membership before proceeding.
router.get('/boards/:boardId/tasks', param('boardId').isUUID(), validate, requireBoardAccess, ctrl.list);
router.post(
  '/boards/:boardId/tasks',
  param('boardId').isUUID(),
  body('title').trim().notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  validate,
  requireBoardAccess,
  ctrl.create
);
router.patch(
  '/boards/:boardId/tasks/reorder',
  param('boardId').isUUID(),
  body('order').isArray({ min: 1 }),
  body('order.*.id').isUUID(),
  body('order.*.position').isInt({ min: 0 }),
  validate,
  requireBoardAccess,
  ctrl.reorder
);

// Individual task routes — look up the board via the task, then check access.
router.get('/tasks/:id', param('id').isUUID(), validate, requireTaskBoardAccess, ctrl.getById);
router.patch(
  '/tasks/:id',
  param('id').isUUID(),
  body('title').optional().trim().notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').not().exists().withMessage('Use PATCH /tasks/:id/move to change status'),
  validate,
  requireTaskBoardAccess,
  ctrl.update
);
router.delete('/tasks/:id', param('id').isUUID(), validate, requireTaskBoardAccess, ctrl.remove);
router.patch(
  '/tasks/:id/move',
  param('id').isUUID(),
  body('status').isIn(['backlog', 'todo', 'in_progress', 'review', 'done', 'archived']),
  validate,
  requireTaskBoardAccess,
  ctrl.move
);
router.get('/tasks/:id/activity', param('id').isUUID(), validate, requireTaskBoardAccess, ctrl.activity);

export default router;
