import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from '../../services/workflow.service';

const svc = new WorkflowService();

export class WorkflowsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await svc.listByBoard(req.params.boardId);
      res.json({ data: rules });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await svc.create({ ...req.body, board_id: req.params.boardId });
      res.status(201).json({ data: rule });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await svc.update(req.params.id, req.body);
      res.json({ data: rule });
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.remove(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}
