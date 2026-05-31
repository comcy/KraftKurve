import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { NutritionService, NutritionEntryDto, ChartDataItem } from 'lib-nutrition-data-access';

@Component({
  selector: 'app-nutrition-history-sheet',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, DragDropModule],
  templateUrl: './nutrition-history-sheet.component.html',
  styleUrl: './nutrition-history-sheet.component.scss',
})
export class NutritionHistorySheetComponent implements OnInit {
  private readonly nutritionService = inject(NutritionService);
  private readonly sheetRef = inject(MatBottomSheetRef<NutritionHistorySheetComponent>);

  readonly entries = signal<NutritionEntryDto[]>([]);
  readonly chartData = signal<ChartDataItem[]>([]);
  readonly proteinGoal = signal<number | null>(null);
  readonly totalEntries = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 20;
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly selectedPeriod = signal<'week' | 'month' | 'year'>('week');

  readonly maxChartValue = computed(() => {
    const data = this.chartData();
    const goal = this.proteinGoal() || 100;
    if (data.length === 0) return goal * 1.2;
    const maxData = Math.max(...data.map(d => d.value));
    return Math.max(maxData, goal) * 1.1; // Add 10% headroom
  });

  readonly groupedEntries = computed(() => {
    const list = this.entries();
    const groups: { date: string; entries: NutritionEntryDto[]; totalProtein: number }[] = [];

    list.forEach((entry) => {
      let group = groups.find((g) => g.date === entry.date);
      if (!group) {
        group = { date: entry.date, entries: [], totalProtein: 0 };
        groups.push(group);
      }
      group.entries.push(entry);
      group.totalProtein += entry.proteinG;
    });

    return groups;
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadHistory(), this.loadChart(), this.loadSettings()]);
  }

  onDragEnd(event: CdkDragEnd): void {
    const offset = event.distance.y;
    // If dragged down more than 150px, close the sheet
    if (offset > 150) {
      this.close();
    } else {
      // Reset position if not closed
      event.source.reset();
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const settings = await this.nutritionService.getSettings();
      this.proteinGoal.set(settings.proteinGoalG);
    } catch {
      // ignore
    }
  }

  async onPeriodChange(period: 'week' | 'month' | 'year'): Promise<void> {
    this.selectedPeriod.set(period);
    await this.loadChart();
  }

  async loadHistory(append = false): Promise<void> {
    if (append) this.loadingMore.set(true);
    else this.loading.set(true);

    try {
      const page = append ? this.currentPage() + 1 : 1;
      const res = await this.nutritionService.getHistory(page, this.pageSize);
      
      if (append) {
        this.entries.set([...this.entries(), ...res.entries]);
        this.currentPage.set(page);
      } else {
        this.entries.set(res.entries);
        this.currentPage.set(1);
      }
      this.totalEntries.set(res.total);
    } catch {
      // ignore
    } finally {
      this.loading.set(false);
      this.loadingMore.set(false);
    }
  }

  async loadChart(): Promise<void> {
    try {
      const res = await this.nutritionService.getChartData(this.selectedPeriod());
      this.chartData.set(res.data);
    } catch {
      // ignore
    }
  }

  close(): void {
    this.sheetRef.dismiss();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }

  trackByDate(_: number, item: any) {
    return item.date;
  }

  trackById(_: number, item: NutritionEntryDto) {
    return item.id;
  }
}
