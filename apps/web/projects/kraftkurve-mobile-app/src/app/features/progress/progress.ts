import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-progress',
  standalone: true,
  template: `
    <div class="feature-container">
      <h1 class="font-headline">DATA ARCHIVE</h1>
      <p class="font-body-md">Progress analytics module coming soon...</p>
    </div>
  `,
  styles: [`
    .feature-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      text-align: center;
      padding-top: 48px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressComponent {}
