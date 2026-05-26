import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../../services/users.service';

const svc = new UsersService();

export class UsersController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await svc.register(req.body);
      res.status(201).json({ data: { user, token } });
    } catch (err) { next(err); }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await svc.login(req.body.email, req.body.password);
      res.json({ data: { user, token } });
    } catch (err) { next(err); }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await svc.getById(req.user!.userId);
      res.json({ data: user });
    } catch (err) { next(err); }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await svc.update(req.user!.userId, req.body);
      res.json({ data: user });
    } catch (err) { next(err); }
  }
}
