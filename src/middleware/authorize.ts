import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db';

/**
 * Confirms the requesting user is a member or owner of the board identified
 * by req.params.boardId (task-level routes) or req.params.id (board-level routes).
 */
export function requireBoardAccess(req: Request, res: Response, next: NextFunction) {
  const boardId = req.params.boardId ?? req.params.id;
  _checkAccess(boardId, req.user!.userId, 'member', res, next);
}

/**
 * Confirms the requesting user is the owner of the board. Used for destructive
 * or administrative operations (delete, add member, etc.).
 */
export function requireBoardOwner(req: Request, res: Response, next: NextFunction) {
  const boardId = req.params.boardId ?? req.params.id;
  _checkAccess(boardId, req.user!.userId, 'owner', res, next);
}

/**
 * For routes where only a task id is in params (PATCH/DELETE /tasks/:id),
 * looks up the task's board then checks membership.
 */
export async function requireTaskBoardAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await db.query<{ board_id: string }>(
      'SELECT board_id FROM tasks WHERE id = $1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    await _checkAccess(rows[0].board_id, req.user!.userId, 'member', res, next);
  } catch (err) {
    next(err);
  }
}

async function _checkAccess(
  boardId: string,
  userId: string,
  role: 'member' | 'owner',
  res: Response,
  next: NextFunction
) {
  try {
    const query =
      role === 'owner'
        ? 'SELECT id FROM boards WHERE id = $1 AND owner_id = $2'
        : `SELECT id FROM boards WHERE id = $1
           AND (owner_id = $2 OR id IN (
             SELECT board_id FROM board_members WHERE user_id = $2
           ))`;

    const { rows } = await db.query(query, [boardId, userId]);

    if (!rows.length) {
      return res.status(403).json({ error: role === 'owner' ? 'Only the board owner can do this' : 'Access denied' });
    }
    next();
  } catch (err) {
    next(err);
  }
}
