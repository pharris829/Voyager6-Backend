import { Router } from 'express';
import { body, param } from 'express-validator';
import { TasksController } from '../controllers/tasks.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();
const ctrl = new TasksController();

router.use(authenticate);

router.get('/boards/:boardId/tasks', param('boardId').isUUID(), validate, ctrl.list);
router.post(
  '/boards/:boardId/tasks',
  param('boardId').isUUID(),
  body('title').trim().notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  validate,
  ctrl.create
);
router.get('/tasks/:id', param('id').isUUID(), validate, ctrl.getById);
router.patch(
  '/tasks/:id',
  param('id').isUUID(),
  body('title').optional().trim().notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').not().exists().withMessage('Use PATCH /tasks/:id/move to change status'),
  validate,
  ctrl.update
);
router.delete('/tasks/:id', param('id').isUUID(), validate, ctrl.remove);
router.patch('/tasks/:id/move', param('id').isUUID(), body('status').isIn(['backlog', 'todo', 'in_progress', 'review', 'done']), validate, ctrl.move);

export default router;
