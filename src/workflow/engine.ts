import { db } from '../data/db';
import { Task, WorkflowRule, WorkflowAction, WorkflowTrigger } from '../types';
import { logger } from '../utils/logger';

export class WorkflowEngine {
  async evaluate(
    trigger: WorkflowTrigger,
    task: Task,
    context: Record<string, unknown> = {}
  ): Promise<void> {
    const { rows: rules } = await db.query<WorkflowRule>(
      'SELECT * FROM workflow_rules WHERE board_id = $1 AND trigger = $2 AND is_active = true',
      [task.board_id, trigger]
    );

    for (const rule of rules) {
      if (!this.matchesConditions(rule.conditions, task, context)) continue;
      for (const action of rule.actions) {
        await this.executeAction(action, task).catch((err) =>
          logger.error(`Workflow action failed [rule=${rule.id}]`, err)
        );
      }
    }
  }

  private matchesConditions(
    conditions: Record<string, unknown>,
    task: Task,
    context: Record<string, unknown>
  ): boolean {
    for (const [key, expected] of Object.entries(conditions)) {
      const actual = (task as Record<string, unknown>)[key] ?? context[key];
      if (actual !== expected) return false;
    }
    return true;
  }

  private async executeAction(action: WorkflowAction, task: Task): Promise<void> {
    switch (action.type) {
      case 'set_status':
        await db.query('UPDATE tasks SET status = $2, updated_at = NOW() WHERE id = $1', [
          task.id,
          action.payload.status,
        ]);
        break;
      case 'assign':
        await db.query('UPDATE tasks SET assignee_id = $2, updated_at = NOW() WHERE id = $1', [
          task.id,
          action.payload.userId,
        ]);
        break;
      case 'add_tag':
        await db.query(
          "UPDATE tasks SET tags = array_append(tags, $2), updated_at = NOW() WHERE id = $1 AND NOT ($2 = ANY(tags))",
          [task.id, action.payload.tag]
        );
        break;
      case 'set_priority':
        await db.query('UPDATE tasks SET priority = $2, updated_at = NOW() WHERE id = $1', [
          task.id,
          action.payload.priority,
        ]);
        break;
      case 'notify':
        logger.info(`[Workflow notify] task=${task.id} message=${action.payload.message}`);
        break;
    }
  }
}
