import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { TrainingService, TrainingSessionDto, TrainingExerciseDto, TrainingSetDto } from 'lib-training-data-access';

@Component({
  selector: 'lib-workout-detail-sheet',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, DragDropModule],
  template: `
    <div class="history-sheet" cdkDrag cdkDragLockAxis="y" (cdkDragEnded)="onDragEnd($event)">
      <!-- Drag Handle -->
      <div class="drag-handle" cdkDragHandle>
        <div class="handle-bar"></div>
      </div>

      <!-- Sticky Header -->
      <header class="sheet-header" cdkDragHandle>
        <div class="header-top">
          <span class="label-caps">WORKOUT ARCHIVE / DETAILS</span>
        </div>
        
        <div class="session-meta">
          <div class="meta-item">
            <span class="label-caps">DATE</span>
            <span class="data-mono">{{ formatDate(data.session.date) }}</span>
          </div>
          <div class="meta-item">
            <span class="label-caps">TYPE / PROTOCOL</span>
            <span class="badge label-caps">{{ data.session.planName || data.session.templateType }}</span>
            <span class="label-caps routine-sub" *ngIf="data.session.routineName">{{ data.session.routineName }}</span>
          </div>
        </div>
      </header>

      <!-- Scrollable Content -->
      <div class="sheet-content scroll-container">
        <div class="exercise-list">
          @for (ex of data.exercises; track ex.id) {
            <div class="exercise-group">
              <div class="exercise-header label-caps">
                {{ ex.exerciseName }}
              </div>
              
              <ul class="set-list">
                @for (set of setsByExercise()[ex.id]; track set.id; let i = $index) {
                  <li class="set-item" [class.skipped]="!set.done">
                    <span class="set-num data-mono">S{{ i + 1 }}</span>
                    <div class="set-data">
                      <span class="data-mono">{{ set.weightKg }}KG</span>
                      <span class="label-caps">X</span>
                      <span class="data-mono">{{ set.reps }} REPS</span>
                    </div>
                    @if (set.done) {
                      <mat-icon class="status-icon">done</mat-icon>
                    } @else {
                      <mat-icon class="status-icon skipped-icon">close</mat-icon>
                    }
                  </li>
                } @empty {
                  <li class="empty-sets label-caps">NO SET DATA ARCHIVED.</li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-sheet {
      height: 90dvh;
      display: flex;
      flex-direction: column;
      background: var(--background);
      color: var(--on-surface);
      overflow: hidden;
      border-top: 2px solid var(--primary);
    }

    .drag-handle {
      height: 32px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: grab;
      background: var(--surface-container-low);
      flex-shrink: 0;
      
      .handle-bar {
        width: 36px;
        height: 4px;
        background: var(--outline-variant);
        border-radius: 2px;
        opacity: 0.5;
      }
    }

    .sheet-header {
      padding: 0 16px 16px;
      background: var(--surface-container-low);
      border-bottom: 1px solid var(--outline-variant);
      flex-shrink: 0;
    }

    .header-top {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }

    .session-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .meta-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .label-caps { font-size: 8px; opacity: 0.6; }
        .data-mono { font-size: 14px; color: var(--primary); }
      }

      .badge {
        background: var(--secondary);
        color: var(--on-secondary);
        padding: 2px 8px;
        font-size: 8px;
        align-self: flex-start;
      }

      .routine-sub {
        font-size: 10px;
        color: var(--tertiary);
        margin-top: 2px;
      }
    }

    .sheet-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      overscroll-behavior: contain;
    }

    .exercise-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .exercise-header {
      background: var(--surface-container-high);
      border-left: 3px solid var(--primary);
      padding: 8px 12px;
      font-size: 10px;
      margin-bottom: 12px;
    }

    .set-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .set-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--outline-variant);

      .set-num { font-size: 10px; opacity: 0.4; width: 24px; }
      .set-data {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        .label-caps { font-size: 8px; opacity: 0.5; }
      }
      .status-icon { color: var(--tertiary); font-size: 18px; width: 18px; height: 18px; }
      
      &.skipped {
        opacity: 0.5;
        .set-data { text-decoration: line-through; }
        .skipped-icon { color: var(--error); }
      }
    }

    .empty-sets {
      font-size: 8px;
      opacity: 0.4;
      text-align: center;
      padding: 8px;
    }
  `]
})
export class WorkoutDetailSheetComponent implements OnInit {
  private readonly trainingApi = inject(TrainingService);
  private readonly sheetRef = inject(MatBottomSheetRef<WorkoutDetailSheetComponent>);
  protected readonly data = inject<{ session: TrainingSessionDto, exercises: TrainingExerciseDto[] }>(MAT_BOTTOM_SHEET_DATA);

  protected readonly setsByExercise = signal<Record<string, TrainingSetDto[]>>({});

  async ngOnInit() {
    await this.loadAllSets();
  }

  private async loadAllSets() {
    const map: Record<string, TrainingSetDto[]> = {};
    for (const ex of this.data.exercises) {
      try {
        const sets = await this.trainingApi.listSets(this.data.session.id, ex.id);
        map[ex.id] = sets;
      } catch {
        map[ex.id] = [];
      }
    }
    this.setsByExercise.set(map);
  }

  onDragEnd(event: CdkDragEnd): void {
    if (event.distance.y > 150) {
      this.sheetRef.dismiss();
    } else {
      event.source.reset();
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }
}
