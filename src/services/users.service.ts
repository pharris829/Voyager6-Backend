import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../data/db';
import { User } from '../types';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

interface UserRow extends User { password_hash: string; }

const BCRYPT_ROUNDS = 12;

export class UsersService {
  async register(data: { email: string; password: string; name: string }): Promise<{ user: User; token: string }> {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existing.rows.length) throw new AppError(409, 'Email already registered');

    const id = uuidv4();
    const result = await db.query<UserRow>(
      'INSERT INTO users (id, email, name, password_hash) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, data.email, data.name, await bcrypt.hash(data.password, BCRYPT_ROUNDS)]
    );
    const user = this.sanitize(result.rows[0]);
    return { user, token: this.sign(user) };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const result = await db.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
    const row = result.rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      throw new AppError(401, 'Invalid credentials');
    }
    const user = this.sanitize(row);
    return { user, token: this.sign(user) };
  }

  async getById(id: string): Promise<User | null> {
    const result = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? this.sanitize(result.rows[0]) : null;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const result = await db.query<UserRow>(
      'UPDATE users SET name = COALESCE($2, name), avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, data.name, data.avatar_url]
    );
    if (!result.rows[0]) throw new AppError(404, 'User not found');
    return this.sanitize(result.rows[0]);
  }

  private sanitize(row: UserRow): User {
    const { password_hash: _p, ...user } = row;
    return user as User;
  }

  private sign(user: User): string {
    return jwt.sign({ userId: user.id, email: user.email }, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
  }
}
