import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExerciseSuggestionDto } from 'lib-training-data-access';

@Component({
  selector: 'kk-virtual-trainer-suggestion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './virtual-trainer-suggestion.html',
  styles: [`
    .suggestion-card {
      border: 1px dashed #ff9100;
      background: rgba(255, 145, 0, 0.05);
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .suggestion-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: #ff9100;
      font-size: 0.7rem;
    }
    .suggestion-goal {
      font-size: 1.1rem;
      color: #fff;
      margin-bottom: 0.25rem;
    }
    .suggestion-reason {
      font-size: 0.75rem;
      opacity: 0.7;
      line-height: 1.2;
    }
    .ai-badge {
      background: #ff9100;
      color: #000;
      padding: 0.1rem 0.3rem;
      font-size: 0.6rem;
      font-weight: bold;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualTrainerSuggestionComponent {
  @Input({ required: true }) suggestion!: ExerciseSuggestionDto;
}
