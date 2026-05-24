import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../infrastructure/repositories/user.repository.interface';
import { IInviteRepository } from '../../infrastructure/repositories/invite.repository.interface';
import { User } from '../../domain/user.entity';
import { Invite } from '../../domain/invite.entity';
import { hashPassword, verifyPassword } from './password.util';
import { signToken } from './jwt.util';

function now(): string {
  return new Date().toISOString();
}

function makeBase(id = uuidv4()): { id: string; createdAt: string; updatedAt: string; version: number } {
  const ts = now();
  return { id, createdAt: ts, updatedAt: ts, version: 1 };
}

export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly invites: IInviteRepository,
  ) {}

  /** Creates the initial admin if no users exist. */
  async bootstrapAdmin(email: string, password: string): Promise<User> {
    const existing = await this.users.findAll();
    if (existing.length > 0) {
      throw new Error('Admin already initialised');
    }
    const user: User = {
      ...makeBase(),
      email,
      passwordHash: await hashPassword(password),
      role: 'admin',
      displayName: 'Admin',
      isActive: true,
    };
    return this.users.save(user);
  }

  /** Creates an admin when none exists yet. */
  async ensureAdminExists(email: string, password: string): Promise<{ user: User; created: boolean }> {
    const existing = await this.users.findAll();
    const admin = existing.find((user) => user.role === 'admin');
    if (admin) {
      return { user: admin, created: false };
    }

    const user: User = {
      ...makeBase(),
      email,
      passwordHash: await hashPassword(password),
      role: 'admin',
      displayName: 'Admin',
      isActive: true,
    };
    const saved = await this.users.save(user);
    return { user: saved, created: true };
  }

  /** Admin creates an invite link (code). */
  async createInvite(createdByUserId: string, expiresInHours = 72): Promise<Invite> {
    const code = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
    const invite: Invite = {
      ...makeBase(),
      code,
      createdByUserId,
      usedByUserId: null,
      usedAt: null,
      status: 'pending',
      expiresAt,
    };
    return this.invites.save(invite);
  }

  /** User registers with a valid invite code. */
  async register(
    inviteCode: string,
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ user: User; token: string }> {
    const invite = await this.invites.findByCode(inviteCode);
    if (!invite || invite.status !== 'pending') {
      throw new Error('Invalid or already used invite code');
    }
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      throw new Error('Invite code expired');
    }
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const user: User = {
      ...makeBase(),
      email,
      passwordHash: await hashPassword(password),
      role: 'user',
      displayName,
      isActive: true,
    };
    await this.users.save(user);

    // Mark invite as used
    await this.invites.save({
      ...invite,
      status: 'used',
      usedByUserId: user.id,
      usedAt: now(),
      updatedAt: now(),
      version: invite.version + 1,
    });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { user, token };
  }

  /** Login with email + password. Returns JWT. */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { user, token };
  }
}
