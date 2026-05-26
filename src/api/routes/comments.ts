import { Router } from 'express';
import { body, param } from 'express-validator';
import { CommentsController } from '../controllers/comments.controller';
import { authenticate } from '../../middleware/auth';
import { requireTaskBoardAccess } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';

const router = Router();
const ctrl = new CommentsController();

router.use(authenticate);

router.get(
  '/tasks/:taskId/comments',
  param('taskId').isUUID(),
  validate,
  // Re-use task board access: look up the task's board and check membership.
  (req, res, next) => { req.params.id = req.params.taskId; next(); },
  requireTaskBoardAccess,
  ctrl.list
);

router.post(
  '/tasks/:taskId/comments',
  param('taskId').isUUID(),
  body('body').trim().notEmpty(),
  validate,
  (req, res, next) => { req.params.id = req.params.taskId; next(); },
  requireTaskBoardAccess,
  ctrl.create
);

router.patch(
  '/comments/:id',
  param('id').isUUID(),
  body('body').trim().notEmpty(),
  validate,
  ctrl.update
);

router.delete(
  '/comments/:id',
  param('id').isUUID(),
  validate,
  ctrl.remove
);

export default router;
