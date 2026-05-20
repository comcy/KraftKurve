export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  inviteCode: string;
  email: string;
  password: string;
  displayName: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface InviteResponse {
  code: string;
  expiresAt: string | null;
}

export interface IAuthService {
  login(req: LoginRequest): Promise<AuthResponse>;
  register(req: RegisterRequest): Promise<AuthResponse>;
  createInvite(): Promise<InviteResponse>;
  logout(): void;
  getToken(): string | null;
  getCurrentUser(): AuthUser | null;
}
