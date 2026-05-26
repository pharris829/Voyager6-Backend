import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { Comment } from '../types';
import { AppError } from '../middleware/errorHandler';
import { EventBus } from '../events/eventBus';

const events = EventBus.getInstance();

export class CommentsService {
  async listByTask(taskId: string): Promise<Comment[]> {
    const { rows } = await db.query<Comment>(
      `SELECT c.*, u.name AS author_name, u.avatar_url AS author_avatar
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    return rows;
  }

  async create(taskId: string, authorId: string, body: string): Promise<Comment> {
    const { rows } = await db.query<Comment>(
      `INSERT INTO comments (id, task_id, author_id, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uuidv4(), taskId, authorId, body]
    );
    const comment = rows[0];
    events.emit('comment.created', comment);
    return comment;
  }

  async update(id: string, authorId: string, body: string): Promise<Comment> {
    const { rows } = await db.query<Comment>(
      `UPDATE comments SET body = $2, updated_at = NOW()
       WHERE id = $1 AND author_id = $3
       RETURNING *`,
      [id, body, authorId]
    );
    if (!rows[0]) throw new AppError(404, 'Comment not found or not yours');
    return rows[0];
  }

  async remove(id: string, authorId: string): Promise<void> {
    const { rowCount } = await db.query(
      'DELETE FROM comments WHERE id = $1 AND author_id = $2',
      [id, authorId]
    );
    if (!rowCount) throw new AppError(404, 'Comment not found or not yours');
  }
}
