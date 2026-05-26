import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { WorkflowRule } from '../types';
import { AppError } from '../middleware/errorHandler';

export class WorkflowService {
  async listByBoard(boardId: string): Promise<WorkflowRule[]> {
    const result = await db.query<WorkflowRule>(
      'SELECT * FROM workflow_rules WHERE board_id = $1 ORDER BY created_at ASC',
      [boardId]
    );
    return result.rows;
  }

  async create(data: Omit<WorkflowRule, 'id' | 'created_at' | 'is_active'>): Promise<WorkflowRule> {
    const id = uuidv4();
    const result = await db.query<WorkflowRule>(
      `INSERT INTO workflow_rules (id, board_id, name, trigger, conditions, actions, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING *`,
      [id, data.board_id, data.name, data.trigger, JSON.stringify(data.conditions), JSON.stringify(data.actions)]
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<WorkflowRule>): Promise<WorkflowRule> {
    const result = await db.query<WorkflowRule>(
      `UPDATE workflow_rules SET
        name = COALESCE($2, name),
        is_active = COALESCE($3, is_active),
        conditions = COALESCE($4, conditions),
        actions = COALESCE($5, actions)
       WHERE id = $1 RETURNING *`,
      [id, data.name, data.is_active, data.conditions ? JSON.stringify(data.conditions) : null, data.actions ? JSON.stringify(data.actions) : null]
    );
    if (!result.rows[0]) throw new AppError(404, 'Workflow rule not found');
    return result.rows[0];
  }

  async remove(id: string): Promise<void> {
    await db.query('DELETE FROM workflow_rules WHERE id = $1', [id]);
  }
}
