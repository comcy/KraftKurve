import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from 'data-access-auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
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
