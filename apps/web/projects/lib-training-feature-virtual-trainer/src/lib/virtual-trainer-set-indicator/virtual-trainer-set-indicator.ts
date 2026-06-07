import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'kk-virtual-trainer-set-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './virtual-trainer-set-indicator.html',
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
    }
    .ai-indicator {
      width: 6px;
      height: 6px;
      background: #ff9100;
      border-radius: 50%;
      box-shadow: 0 0 5px #ff9100;
      margin-left: 4px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { opacity: 0.4; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); }
      100% { opacity: 0.4; transform: scale(0.8); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualTrainerSetIndicatorComponent {
  @Input() active = true;
}
