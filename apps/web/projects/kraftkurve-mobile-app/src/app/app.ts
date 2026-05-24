import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
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
  protected readonly title = 'KRAFTKURVE';
  protected readonly version = 'V.2.4.1';
  protected readonly systemOnline = 'SYSTEM ONLINE';
  
  // Navigation Labels
  protected readonly navDashboard = 'DASHBOARD';
  protected readonly navTraining = 'TRAINING';
  protected readonly navNutrition = 'FUEL';
  protected readonly navProgress = 'DATA';
}
