import { Router } from 'express';
import { body, param } from 'express-validator';
import { WorkflowsController } from '../controllers/workflows.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();
const ctrl = new WorkflowsController();

router.use(authenticate);

router.get('/boards/:boardId/workflows', param('boardId').isUUID(), validate, ctrl.list);
router.post(
  '/boards/:boardId/workflows',
  param('boardId').isUUID(),
  body('name').trim().notEmpty(),
  body('trigger').isIn(['status_change', 'assignment', 'due_date', 'comment', 'created']),
  body('actions').isArray({ min: 1 }),
  validate,
  ctrl.create
);
router.patch(
  '/workflows/:id',
  param('id').isUUID(),
  body('is_active').optional().isBoolean(),
  validate,
  ctrl.update
);
router.delete('/workflows/:id', param('id').isUUID(), validate, ctrl.remove);

export default router;
