import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { NutritionStateService } from '../../core/services/nutrition-state.service';

@Component({
  selector: 'app-nutrition-history-sheet',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, MatDividerModule],
  template: `
    <div class="history-sheet">
      <header class="sheet-header">
        <h2 class="label-caps">ENTRY LOG</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <mat-divider></mat-divider>

      <div class="sheet-content">
        <mat-list>
          <mat-list-item *ngFor="let entry of summary()?.entries">
            <mat-icon matListItemIcon>restaurant</mat-icon>
            <div matListItemTitle class="entry-name">{{ entry.name }}</div>
            <div matListItemLine class="entry-meta label-caps">
              {{ entry.mealType }} • {{ entry.createdAt | date:'shortTime' }}
            </div>
            <div matListItemMeta class="entry-value data-mono">{{ entry.proteinG }}G</div>
          </mat-list-item>
          
          <div *ngIf="summary()?.entries?.length === 0" class="empty-state label-caps">
            NO ENTRIES RECORDED
          </div>
        </mat-list>
      </div>
    </div>
  `,
  styles: [`
    .history-sheet {
      background: var(--surface-container);
      color: var(--on-surface);
      padding-bottom: 32px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;

      h2 {
        margin: 0;
        letter-spacing: 2px;
      }
    }

    .sheet-content {
      padding: 8px 0;
    }

    .entry-name {
      font-family: var(--font-body);
      font-weight: 700;
      font-size: 14px;
    }

    .entry-meta {
      font-size: 8px;
      opacity: 0.6;
    }

    .entry-value {
      font-size: 16px;
      color: var(--primary-alt);
    }

    .empty-state {
      padding: 48px;
      text-align: center;
      opacity: 0.5;
    }
  `]
})
export class NutritionHistorySheetComponent {
  private readonly nutritionState = inject(NutritionStateService);
  private readonly sheetRef = inject(MatBottomSheetRef<NutritionHistorySheetComponent>);

  protected readonly summary = this.nutritionState.summary;

  close() {
    this.sheetRef.dismiss();
  }
}
