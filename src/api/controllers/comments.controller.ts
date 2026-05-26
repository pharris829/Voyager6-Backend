import { Request, Response, NextFunction } from 'express';
import { CommentsService } from '../../services/comments.service';

const svc = new CommentsService();

export class CommentsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const comments = await svc.listByTask(req.params.taskId);
      res.json({ data: comments });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await svc.create(req.params.taskId, req.user!.userId, req.body.body);
      res.status(201).json({ data: comment });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await svc.update(req.params.id, req.user!.userId, req.body.body);
      res.json({ data: comment });
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.remove(req.params.id, req.user!.userId);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}
