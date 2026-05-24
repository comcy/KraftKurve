import { Component, inject, Injector, input, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService, IfPermissionDirective } from 'lib-auth-data-access';
import { ThemeService } from 'shared-utils';

@Component({
  selector: 'app-admin-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    IfPermissionDirective,
  ],
  template: `
    <div [class.admin-app-container]="!hideLayout()">
      @if (!hideLayout()) {
        <aside class="admin-register-nav">
          <div class="nav-header">
            <mat-icon>settings</mat-icon>
          </div>
          
          <nav class="register-items">
            <a [routerLink]="['dashboard']" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" 
               mat-icon-button [matTooltip]="labelDashboard" *ifPermission="'VIEW_ADMIN_DASHBOARD'">
              <mat-icon>dashboard</mat-icon>
            </a>
            <a [routerLink]="['invites']" routerLinkActive="active" 
               mat-icon-button [matTooltip]="labelInvites" *ifPermission="'MANAGE_INVITES'">
              <mat-icon>mail</mat-icon>
            </a>
            <a [routerLink]="['users']" routerLinkActive="active" 
               mat-icon-button [matTooltip]="labelUsers" *ifPermission="'MANAGE_USERS'">
              <mat-icon>people</mat-icon>
            </a>
            <a [routerLink]="['exercises']" routerLinkActive="active" 
               mat-icon-button [matTooltip]="labelCatalog" *ifPermission="'MANAGE_EXERCISES'">
              <mat-icon>fitness_center</mat-icon>
            </a>
          </nav>

          <div class="spacer"></div>

          <div class="nav-footer">
            <button type="button" (click)="logout()" mat-icon-button [matTooltip]="labelLogout">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </aside>
      }

      <main class="admin-content">
        @if (!hideLayout()) {
          <header class="admin-breadcrumb-bar">
            <nav class="breadcrumbs">
              <a [routerLink]="['dashboard']" class="breadcrumb-item">Admin</a>
              @if (currentBreadcrumb(); as bc) {
                <mat-icon class="separator">chevron_right</mat-icon>
                <span class="breadcrumb-item active">{{ bc }}</span>
              }
            </nav>
          </header>
        }
        
        <div class="content-viewport">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private auth: AuthService;
  private router: Router;
  private activatedRoute: ActivatedRoute;
  private themeService: ThemeService;
  private injector: Injector;

  hideLayout = input<boolean>(false);

  protected readonly currentBreadcrumb: Signal<string | null>;

  protected readonly labelTitle = 'KraftKurve Admin';
  protected readonly labelDashboard = 'Dashboard';
  protected readonly labelInvites = 'Invites';
  protected readonly labelUsers = 'Nutzer';
  protected readonly labelCatalog = 'Katalog';
  protected readonly labelLogin = 'Login';
  protected readonly labelLogout = 'Logout';

  constructor() {
    this.auth = inject(AuthService);
    this.router = inject(Router);
    this.activatedRoute = inject(ActivatedRoute);
    this.themeService = inject(ThemeService);
    this.injector = inject(Injector);

    this.currentBreadcrumb = toSignal(
      this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        map(() => {
          let child = this.activatedRoute.firstChild;
          while (child?.firstChild) {
            child = child.firstChild;
          }
          return child?.snapshot.data['breadcrumb'] || null;
        })
      ),
      { injector: this.injector }
    );
  }

  ngOnInit() {
    console.log('[AdminApp] Init. hideLayout:', this.hideLayout());
  }

  protected isLoggedIn(): boolean {
    return !!this.auth.getToken();
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
