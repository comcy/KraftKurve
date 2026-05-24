import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService, IfPermissionDirective } from 'lib-auth-data-access';
import { ThemeService } from 'shared-utils';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    IfPermissionDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);

  // Routes
  protected readonly routeDashboard = '/dashboard';
  protected readonly routeTraining = '/training';
  protected readonly routeNutrition = '/nutrition';
  protected readonly routeProgress = '/progress';
  protected readonly routeAdmin = '/admin';
  protected readonly routeAdminInvites = '/admin/invites';
  protected readonly routeAdminUsers = '/admin/users';
  protected readonly routeAdminExercises = '/admin/exercises';
  protected readonly routeAuthLogin = '/auth/login';
  protected readonly routeProfile = '/profile';

  // Labels
  protected readonly labelAppTitle = 'KraftKurve';
  protected readonly labelDashboard = 'Dashboard';
  protected readonly labelTraining = 'Training';
  protected readonly labelNutrition = 'Nutrition';
  protected readonly labelProgress = 'Progress';
  protected readonly labelAdmin = 'Admin';
  protected readonly labelSettings = 'Settings';
  protected readonly labelInvites = 'Invites';
  protected readonly labelUsers = 'Nutzer';
  protected readonly labelCatalog = 'Katalog';
  protected readonly labelLogin = 'Login';
  protected readonly labelProfile = 'Profil';
  protected readonly labelLogout = 'Logout';

  protected readonly isLoggedIn = () => !!this.auth.getToken();
  protected readonly currentUser = () => this.auth.getCurrentUser();
  protected readonly isAdmin = () => this.currentUser()?.role === 'admin';
  protected readonly isUser = () => this.currentUser()?.role === 'user' || this.isAdmin();
  protected readonly mfeVersion = 'v1.0.0-federated';

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate([this.routeAuthLogin]);
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
