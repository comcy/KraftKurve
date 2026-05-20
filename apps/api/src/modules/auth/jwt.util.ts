import jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/user.entity';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'change-me-in-production';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] ?? '7d';

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
