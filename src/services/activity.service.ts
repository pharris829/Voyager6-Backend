import { db } from '../data/db';
import { ActivityEvent } from '../types';

export class ActivityService {
  async listForTask(taskId: string, limit = 50): Promise<ActivityEvent[]> {
    const { rows } = await db.query<ActivityEvent>(
      `SELECT a.*, u.name AS actor_name
       FROM activity_events a
       JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'task' AND a.entity_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2`,
      [taskId, limit]
    );
    return rows;
  }

  async listForBoard(boardId: string, limit = 100): Promise<ActivityEvent[]> {
    const { rows } = await db.query<ActivityEvent>(
      `SELECT a.*, u.name AS actor_name
       FROM activity_events a
       JOIN users u ON u.id = a.actor_id
       WHERE a.entity_type = 'task'
         AND a.entity_id IN (SELECT id FROM tasks WHERE board_id = $1)
       ORDER BY a.created_at DESC
       LIMIT $2`,
      [boardId, limit]
    );
    return rows;
  }
}
