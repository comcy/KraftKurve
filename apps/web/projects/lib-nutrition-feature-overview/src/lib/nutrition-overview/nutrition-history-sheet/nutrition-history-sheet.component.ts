import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { NutritionService, NutritionEntryDto, ChartDataItem } from 'lib-nutrition-data-access';
import { MealTypeLabelPipe } from '../nutrition-overview.page';

@Component({
  selector: 'lib-nutrition-history-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, MealTypeLabelPipe],
  templateUrl: './nutrition-history-sheet.component.html',
  styleUrl: './nutrition-history-sheet.component.scss',
})
export class NutritionHistorySheetComponent implements OnInit {
  private readonly nutritionService = inject(NutritionService);
  private readonly sheetRef = inject(MatBottomSheetRef);

  readonly entries = signal<NutritionEntryDto[]>([]);
  readonly chartData = signal<ChartDataItem[]>([]);
  readonly totalEntries = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 20;
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly selectedPeriod = signal<'week' | 'month' | 'year'>('week');

  readonly maxChartValue = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return 100;
    return Math.max(...data.map(d => d.value), 100);
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
    await Promise.all([this.loadHistory(), this.loadChart()]);
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
}
