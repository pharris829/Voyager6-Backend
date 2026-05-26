export const TASK_QUERIES = {
  LIST_BY_BOARD: 'SELECT * FROM tasks WHERE board_id = $1 ORDER BY position ASC',
  GET_BY_ID: 'SELECT * FROM tasks WHERE id = $1',
  DELETE: 'DELETE FROM tasks WHERE id = $1',
  UPDATE_POSITION: 'UPDATE tasks SET position = $2 WHERE id = $1',
} as const;
