import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from 'shared-utils';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly _themeService = inject(ThemeService);
  private readonly _router = inject(Router);

  private readonly _currentUrl = signal('');
  
  protected readonly title = 'KRAFTKURVE';
  protected readonly version = 'V.2.4.1';
  protected readonly systemOnline = 'SYSTEM ONLINE';
  
  // Navigation Labels
  protected readonly navDashboard = 'DASHBOARD';
  protected readonly navTraining = 'TRAINING';
  protected readonly navNutrition = 'NUTRITION';
  protected readonly navProgress = 'PROGRESS';

  readonly showNav = computed(() => !this._currentUrl().includes('/auth/'));

  constructor() {
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this._currentUrl.set(event.urlAfterRedirects || event.url);
    });
  }
}
