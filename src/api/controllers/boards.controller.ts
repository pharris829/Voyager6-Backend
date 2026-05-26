import { Request, Response, NextFunction } from 'express';
import { BoardsService } from '../../services/boards.service';
import { ActivityService } from '../../services/activity.service';

const svc = new BoardsService();
const activitySvc = new ActivityService();

export class BoardsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const boards = await svc.listForUser(req.user!.userId);
      res.json({ data: boards });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const board = await svc.create({ ...req.body, owner_id: req.user!.userId });
      res.status(201).json({ data: board });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const board = await svc.getById(req.params.id);
      if (!board) return res.status(404).json({ error: 'Board not found' });
      res.json({ data: board });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const board = await svc.update(req.params.id, req.body);
      res.json({ data: board });
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.remove(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await svc.listMembers(req.params.id);
      res.json({ data: members });
    } catch (err) { next(err); }
  }

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.addMember(req.params.id, req.body.user_id);
      res.status(201).json({ message: 'Member added' });
    } catch (err) { next(err); }
  }

  async activity(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const events = await activitySvc.listForBoard(req.params.id, limit);
      res.json({ data: events });
    } catch (err) { next(err); }
  }
}
