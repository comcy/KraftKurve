import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from 'shared-utils';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div class="standalone-container">
      <router-outlet />
    </div>
  `,
  styles: [`
    .standalone-container {
      padding: 16px;
      min-height: 100vh;
    }
  `],
})
export class App {
  private readonly themeService = inject(ThemeService);
}
