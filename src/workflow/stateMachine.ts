import { TaskStatus } from '../types';

type Transitions = Record<TaskStatus, TaskStatus[]>;

const VALID_TRANSITIONS: Transitions = {
  backlog:     ['todo', 'archived'],
  todo:        ['in_progress', 'archived'],
  in_progress: ['review', 'todo', 'done'],
  review:      ['in_progress', 'done'],
  done:        ['archived'],
  archived:    [],
};

export function isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedTransitions(from: TaskStatus): TaskStatus[] {
  return VALID_TRANSITIONS[from] ?? [];
}
