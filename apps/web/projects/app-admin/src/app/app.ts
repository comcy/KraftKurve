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
          <a style="font-weight:700;margin-right:0.7rem;color:#3a2a05;text-decoration:none" routerLink="/dashboard">KraftKurve Admin</a>

          @if (isLoggedIn()) {
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" style="padding:0.4rem 0.6rem;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Dashboard</a>
            <a routerLink="/dashboard/invites" routerLinkActive="active" style="padding:0.4rem 0.6rem;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Invites</a>
            <a routerLink="/dashboard/users" routerLinkActive="active" style="padding:0.4rem 0.6rem;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Nutzer</a>
            <a routerLink="/dashboard/exercises" routerLinkActive="active" style="padding:0.4rem 0.6rem;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Katalog</a>
          }

          <span style="margin-left:auto"></span>

          @if (!isLoggedIn()) {
            <a routerLink="/auth/login" style="padding:0.35rem 0.6rem;border:1px solid #cec4aa;border-radius:0.5rem;text-decoration:none;color:#2a2a2a">Login</a>
          } @else {
            <button type="button" (click)="logout()" style="padding:0.35rem 0.6rem;border:1px solid #cec4aa;background:#fff;border-radius:0.5rem;color:#2a2a2a;cursor:pointer">Logout</button>
          }
        </nav>
      </header>

      <router-outlet />
    </div>
  `,
  styles: [`
    .active {
      background: #eee6d0;
      font-weight: 600;
    }
  `],
})
export class App {
  private readonly auth = inject(AuthService);

  protected isLoggedIn(): boolean {
    return !!this.auth.getToken();
  }

  protected logout(): void {
    this.auth.logout();
    window.location.reload();
  }
}
