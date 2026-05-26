import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';
import { Board, User } from '../types';
import { AppError } from '../middleware/errorHandler';

export class BoardsService {
  async listForUser(userId: string): Promise<Board[]> {
    const result = await db.query<Board>(
      `SELECT b.* FROM boards b
       LEFT JOIN board_members bm ON bm.board_id = b.id
       WHERE b.owner_id = $1 OR bm.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getById(id: string): Promise<Board | null> {
    const result = await db.query<Board>('SELECT * FROM boards WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  }

  async create(data: Pick<Board, 'name' | 'description' | 'visibility' | 'owner_id' | 'wip_limit'>): Promise<Board> {
    const id = uuidv4();
    const result = await db.query<Board>(
      `INSERT INTO boards (id, name, description, visibility, owner_id, wip_limit)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, data.name, data.description, data.visibility ?? 'private', data.owner_id, data.wip_limit]
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<Board>): Promise<Board> {
    const result = await db.query<Board>(
      `UPDATE boards SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        visibility = COALESCE($4, visibility),
        wip_limit = COALESCE($5, wip_limit),
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, data.name, data.description, data.visibility, data.wip_limit]
    );
    if (!result.rows[0]) throw new AppError(404, 'Board not found');
    return result.rows[0];
  }

  async remove(id: string): Promise<void> {
    await db.query('DELETE FROM boards WHERE id = $1', [id]);
  }

  async listMembers(boardId: string): Promise<User[]> {
    const result = await db.query<User>(
      `SELECT u.* FROM users u
       JOIN board_members bm ON bm.user_id = u.id
       WHERE bm.board_id = $1`,
      [boardId]
    );
    return result.rows;
  }

  async addMember(boardId: string, userId: string): Promise<void> {
    await db.query(
      'INSERT INTO board_members (board_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [boardId, userId]
    );
  }
}
