import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { Task, TaskStatus } from '../types';
import { AppError } from '../middleware/errorHandler';
import { WorkflowEngine } from '../workflow/engine';
import { EventBus } from '../events/eventBus';
import { isValidTransition } from '../workflow/stateMachine';

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
    const status = data.status ?? 'backlog';

    const posResult = await db.query<{ next: number }>(
      `SELECT COALESCE(MAX(position), -1) + 1 AS next FROM tasks WHERE board_id = $1 AND status = $2`,
      [data.board_id, status]
    );
    const position = posResult.rows[0].next;

    const result = await db.query<Task>(
      `INSERT INTO tasks (id, board_id, title, description, status, priority, assignee_id, reporter_id, due_date, position, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [id, data.board_id, data.title, data.description, status, data.priority ?? 'medium', data.assignee_id, data.reporter_id, data.due_date, position, data.tags ?? []]
    );
    const task = result.rows[0];
    await engine.evaluate('created', task);
    events.emit('task.created', task);
    return task;
  }

  async update(id: string, data: Partial<Task>, actorId: string): Promise<Task> {
    const existing = await this.getById(id);
    if (!existing) throw new AppError(404, 'Task not found');

    // Build a dynamic SET clause so explicit nulls clear the field rather than
    // being swallowed by COALESCE (e.g. assignee_id: null should unassign).
    const MUTABLE = ['title', 'description', 'priority', 'assignee_id', 'due_date', 'tags'] as const;
    type Mutable = typeof MUTABLE[number];
    const fields = MUTABLE.filter((k) => k in data);
    if (fields.length === 0) return existing;

    const setClauses = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = fields.map((k) => (data as Record<Mutable, unknown>)[k]);

    const result = await db.query<Task>(
      `UPDATE tasks SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    const task = result.rows[0];
    events.emit('task.updated', { task, actorId, before: existing });
    return task;
  }

  async move(id: string, status: TaskStatus, actorId: string): Promise<Task> {
    const existing = await this.getById(id);
    if (!existing) throw new AppError(404, 'Task not found');

    if (!isValidTransition(existing.status, status)) {
      throw new AppError(422, `Invalid transition: ${existing.status} → ${status}`);
    }

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

  async reorder(boardId: string, order: Array<{ id: string; position: number }>): Promise<void> {
    // Validate all task IDs belong to the board before writing anything.
    const ids = order.map((o) => o.id);
    const { rows } = await db.query<{ id: string }>(
      `SELECT id FROM tasks WHERE id = ANY($1) AND board_id = $2`,
      [ids, boardId]
    );
    if (rows.length !== ids.length) {
      throw new AppError(422, 'One or more task IDs do not belong to this board');
    }

    // Update all positions in a single transaction.
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const { id, position } of order) {
        await client.query('UPDATE tasks SET position = $2, updated_at = NOW() WHERE id = $1', [id, position]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
