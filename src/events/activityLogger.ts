import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { EventBus } from './eventBus';
import { Task } from '../types';
import { logger } from '../utils/logger';

const events = EventBus.getInstance();

async function logEvent(entityType: 'task' | 'board', entityId: string, actorId: string, action: string, diff?: Record<string, unknown>) {
  try {
    await db.query(
      'INSERT INTO activity_events (id, entity_type, entity_id, actor_id, action, diff) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), entityType, entityId, actorId, action, diff ? JSON.stringify(diff) : null]
    );
  } catch (err) {
    logger.error('Failed to log activity', err);
  }
}

export function registerActivityListeners() {
  events.on('task.created', (task: Task) => {
    logEvent('task', task.id, task.reporter_id, 'created');
  });

  events.on('task.updated', ({ task, actorId, before }: { task: Task; actorId: string; before: Task }) => {
    const diff: Record<string, unknown> = {};
    for (const key of Object.keys(task) as Array<keyof Task>) {
      if (task[key] !== before[key]) diff[key] = { from: before[key], to: task[key] };
    }
    logEvent('task', task.id, actorId, 'updated', diff);
  });

  events.on('task.moved', ({ task, actorId, from, to }: { task: Task; actorId: string; from: string; to: string }) => {
    logEvent('task', task.id, actorId, 'moved', { status: { from, to } });
  });
}
