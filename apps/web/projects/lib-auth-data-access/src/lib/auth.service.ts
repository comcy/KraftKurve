import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  IAuthService,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  InviteResponse,
  AuthUser,
} from './auth.service.interface';
import { ROLE_PERMISSIONS, Permission } from './auth.permissions';

const TOKEN_KEY = 'kk_token';
const USER_KEY = 'kk_user';

@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api/auth';

  async login(req: LoginRequest): Promise<AuthResponse> {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiBase}/login`, req),
      );
      this.persist(res);
      return res;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async register(req: RegisterRequest): Promise<AuthResponse> {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiBase}/register`, req),
      );
      this.persist(res);
      return res;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createInvite(): Promise<InviteResponse> {
    try {
      return await firstValueFrom(
        this.http.post<InviteResponse>(`${this.apiBase}/invite`, {}),
      );
    } catch (error) {
      throw this.toError(error);
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      const message =
        typeof error.error?.error === 'string'
          ? error.error.error
          : typeof error.error?.message === 'string'
            ? error.error.message
            : error.message;
      return new Error(message || 'Request failed');
    }

    return error instanceof Error ? error : new Error('Request failed');
  }
}
