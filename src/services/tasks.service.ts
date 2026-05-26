import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { Task, TaskStatus } from '../types';
import { AppError } from '../middleware/errorHandler';
import { WorkflowEngine } from '../workflow/engine';
import { EventBus } from '../events/eventBus';

const engine = new WorkflowEngine();
const events = EventBus.getInstance();

export class TasksService {
  async listByBoard(boardId: string): Promise<Task[]> {
    const result = await db.query<Task>(
      'SELECT * FROM tasks WHERE board_id = $1 ORDER BY position ASC',
      [boardId]
    );
    return result.rows;
  }

  async getById(id: string): Promise<Task | null> {
    const result = await db.query<Task>('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  }

  async create(data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'position'>): Promise<Task> {
    const id = uuidv4();
    const result = await db.query<Task>(
      `INSERT INTO tasks (id, board_id, title, description, status, priority, assignee_id, reporter_id, due_date, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [id, data.board_id, data.title, data.description, data.status ?? 'backlog', data.priority ?? 'medium', data.assignee_id, data.reporter_id, data.due_date, data.tags ?? []]
    );
    const task = result.rows[0];
    await engine.evaluate('created', task);
    events.emit('task.created', task);
    return task;
  }

  async update(id: string, data: Partial<Task>, actorId: string): Promise<Task> {
    const existing = await this.getById(id);
    if (!existing) throw new AppError(404, 'Task not found');

    const result = await db.query<Task>(
      `UPDATE tasks SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        priority = COALESCE($4, priority),
        assignee_id = COALESCE($5, assignee_id),
        due_date = COALESCE($6, due_date),
        tags = COALESCE($7, tags),
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, data.title, data.description, data.priority, data.assignee_id, data.due_date, data.tags]
    );
    const task = result.rows[0];
    events.emit('task.updated', { task, actorId, before: existing });
    return task;
  }

  async move(id: string, status: TaskStatus, actorId: string): Promise<Task> {
    const existing = await this.getById(id);
    if (!existing) throw new AppError(404, 'Task not found');

    await this.checkWipLimit(existing.board_id, status);

    const result = await db.query<Task>(
      'UPDATE tasks SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, status]
    );
    const task = result.rows[0];
    await engine.evaluate('status_change', task, { from: existing.status, to: status });
    events.emit('task.moved', { task, actorId, from: existing.status, to: status });
    return task;
  }

  async remove(id: string): Promise<void> {
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
  }

  private async checkWipLimit(boardId: string, status: TaskStatus) {
    const board = await db.query<{ wip_limit: number | null }>(
      'SELECT wip_limit FROM boards WHERE id = $1',
      [boardId]
    );
    const limit = board.rows[0]?.wip_limit;
    if (!limit || status !== 'in_progress') return;

    const count = await db.query<{ count: string }>(
      "SELECT COUNT(*) FROM tasks WHERE board_id = $1 AND status = 'in_progress'",
      [boardId]
    );
    if (parseInt(count.rows[0].count, 10) >= limit) {
      throw new AppError(422, `WIP limit of ${limit} reached for in_progress`);
    }
  }
}
