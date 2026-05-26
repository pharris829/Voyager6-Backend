export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type BoardVisibility = 'private' | 'team' | 'public';
export type WorkflowTrigger = 'status_change' | 'assignment' | 'due_date' | 'comment' | 'created';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  visibility: BoardVisibility;
  owner_id: string;
  wip_limit?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  board_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  reporter_id: string;
  due_date?: Date;
  position: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowRule {
  id: string;
  board_id: string;
  name: string;
  trigger: WorkflowTrigger;
  conditions: Record<string, unknown>;
  actions: WorkflowAction[];
  is_active: boolean;
  created_at: Date;
}

export interface WorkflowAction {
  type: 'set_status' | 'assign' | 'notify' | 'add_tag' | 'set_priority';
  payload: Record<string, unknown>;
}

export interface ActivityEvent {
  id: string;
  entity_type: 'task' | 'board' | 'user';
  entity_id: string;
  actor_id: string;
  action: string;
  diff?: Record<string, unknown>;
  created_at: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
}
