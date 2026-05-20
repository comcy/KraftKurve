import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from 'data-access-auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div style="min-height:100vh;background:linear-gradient(180deg,#f9f6ed 0%,#f7f7f7 55%,#ffffff 100%)">
      <header style="position:sticky;top:0;z-index:10;background:#ffffffd9;backdrop-filter:blur(4px);border-bottom:1px solid #e6e0cf">
        <nav style="max-width:980px;margin:0 auto;padding:0.8rem 1rem;display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
          <a style="font-weight:700;margin-right:0.7rem;color:#3a2a05;text-decoration:none" routerLink="/dashboard">KraftKurve</a>

          @if (isUser()) {
            <a routerLink="/dashboard" routerLinkActive="active" style="padding:0.4rem 0.6rem;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Dashboard</a>
            <a routerLink="/training" routerLinkActive="active" style="padding:0.4rem 0.6rem;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Training</a>
            <a routerLink="/nutrition" routerLinkActive="active" style="padding:0.4rem 0.6rem;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Nutrition</a>
            <a routerLink="/progress" routerLinkActive="active" style="padding:0.4rem 0.6rem;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Progress</a>
          }

          <span style="margin-left:auto"></span>

          @if (!isLoggedIn()) {
            <a routerLink="/auth/login" style="padding:0.35rem 0.6rem;border:1px solid #cec4aa;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Login</a>
          } @else {
            @if (isUser()) {
              <a routerLink="/profile" title="Profil" aria-label="Profil" style="width:2rem;height:2rem;border:1px solid #cec4aa;border-radius:999px;text-decoration:none;color:#2a2a2a;display:grid;place-items:center;font-weight:700">U</a>
            }
            @if (isAdmin()) {
              <span style="font-size:0.82rem;color:#6b7280;padding:0.25rem 0.5rem;border:1px solid #e5e7eb;border-radius:0.5rem">Admin: nur Invite-Codes</span>
            }
            <button type="button" (click)="logout()" style="padding:0.35rem 0.6rem;border:1px solid #cec4aa;background:#fff;border-radius:0.5rem;color:#2a2a2a;cursor:pointer">Logout</button>
          }
        </nav>
      </header>

      <router-outlet />
    </div>
  `,
  styles: [],
})
export class App {
  private readonly auth = inject(AuthService);

  protected isLoggedIn(): boolean {
    return !!this.auth.getToken();
  }

  protected isUser(): boolean {
    return this.auth.getCurrentUser()?.role === 'user';
  }

  protected isAdmin(): boolean {
    return this.auth.getCurrentUser()?.role === 'admin';
  }

  protected logout(): void {
    this.auth.logout();
  }
}
