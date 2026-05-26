import { Request, Response, NextFunction } from 'express';
import { TasksService } from '../../services/tasks.service';

const svc = new TasksService();

export class TasksController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await svc.listByBoard(req.params.boardId);
      res.json({ data: tasks });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await svc.create({ ...req.body, board_id: req.params.boardId, reporter_id: req.user!.userId });
      res.status(201).json({ data: task });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await svc.getById(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ data: task });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await svc.update(req.params.id, req.body, req.user!.userId);
      res.json({ data: task });
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.remove(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async move(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await svc.move(req.params.id, req.body.status, req.user!.userId);
      res.json({ data: task });
    } catch (err) { next(err); }
  }
}
