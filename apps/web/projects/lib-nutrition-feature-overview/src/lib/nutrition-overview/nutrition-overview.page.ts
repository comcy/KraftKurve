import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import {
  NutritionService,
  DaySummaryDto,
  FoodItemDto,
  MealType,
} from 'lib-nutrition-data-access';

@Pipe({ name: 'mealTypeLabel', standalone: true })
export class MealTypeLabelPipe implements PipeTransform {
  transform(value: MealType): string {
    const labels: Record<MealType, string> = {
      breakfast: 'Frühstück',
      lunch: 'Mittagessen',
      dinner: 'Abendessen',
      snack: 'Snack',
    };
    return labels[value] ?? value;
  }
}

@Component({
  selector: 'lib-nutrition-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, MealTypeLabelPipe],
  templateUrl: './nutrition-overview.page.html',
  styleUrl: './nutrition-overview.page.scss',
})
export class NutritionOverviewPage implements OnInit {
  private readonly nutritionService = inject(NutritionService);

  readonly summary = signal<DaySummaryDto | null>(null);
  readonly foodItems = signal<FoodItemDto[]>([]);
  readonly loading = signal(false);
  readonly adding = signal(false);
  readonly addError = signal<string | null>(null);
  readonly nameTouched = signal(false);
  readonly showFavorites = signal(false);

  readonly selectedDate = signal(new Date().toISOString().slice(0, 10));

  readonly nameError = computed(() => {
    if (!this.nameTouched()) return null;
    if (!this.draft.name.trim()) return 'Bitte Name eingeben.';
    return null;
  });

  readonly proteinPercent = computed(() => {
    const s = this.summary();
    if (!s || !s.proteinGoalG) return 0;
    return Math.min((s.totalProteinG / s.proteinGoalG) * 100, 100);
  });

  draft = {
    name: '',
    mealType: 'snack' as MealType,
    portionG: 100,
    proteinG: 0,
  };

  favDraft = {
    name: '',
    proteinPer100g: 0,
    defaultPortionG: 100,
  };

  ngOnInit(): void {
    void this.loadAll();
  }

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedDate.set(value);
    void this.loadSummary();
  }

  prefillFromFavorite(item: FoodItemDto): void {
    this.draft.name = item.name;
    this.draft.portionG = item.defaultPortionG;
    this.draft.proteinG = parseFloat(
      ((item.proteinPer100g * item.defaultPortionG) / 100).toFixed(1),
    );
  }

  async onAddEntry(event: Event): Promise<void> {
    event.preventDefault();
    this.nameTouched.set(true);
    const cleanName = this.draft.name.trim();
    if (!cleanName) {
      this.addError.set('Bitte Name angeben.');
      return;
    }
    if (this.draft.proteinG < 0) {
      this.addError.set('Protein muss >= 0 sein.');
      return;
    }

    this.adding.set(true);
    this.addError.set(null);
    try {
      await this.nutritionService.createEntry({
        date: this.selectedDate(),
        name: cleanName,
        mealType: this.draft.mealType,
        portionG: this.draft.portionG,
        proteinG: this.draft.proteinG,
      });
      this.draft = { name: '', mealType: 'snack', portionG: 100, proteinG: 0 };
      this.nameTouched.set(false);
      await this.loadSummary();
    } catch (err) {
      this.addError.set(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      this.adding.set(false);
    }
  }

  onNameBlur(): void {
    this.nameTouched.set(true);
  }

  async onDeleteEntry(id: string): Promise<void> {
    try {
      await this.nutritionService.deleteEntry(id);
      await this.loadSummary();
    } catch {
      // ignore
    }
  }

  async onAddFoodItem(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.favDraft.name) return;
    try {
      await this.nutritionService.createFoodItem({
        name: this.favDraft.name,
        proteinPer100g: this.favDraft.proteinPer100g,
        defaultPortionG: this.favDraft.defaultPortionG,
      });
      this.favDraft = { name: '', proteinPer100g: 0, defaultPortionG: 100 };
      await this.loadFoodItems();
    } catch {
      // ignore
    }
  }

  async onDeleteFoodItem(id: string): Promise<void> {
    try {
      await this.nutritionService.deleteFoodItem(id);
      await this.loadFoodItems();
    } catch {
      // ignore
    }
  }

  private async loadAll(): Promise<void> {
    await Promise.all([this.loadSummary(), this.loadFoodItems()]);
  }

  private async loadSummary(): Promise<void> {
    this.loading.set(true);
    try {
      const s = await this.nutritionService.getDaySummary(this.selectedDate());
      this.summary.set(s);
    } catch {
      // ignore
    } finally {
      this.loading.set(false);
    }
  }

  private async loadFoodItems(): Promise<void> {
    try {
      const items = await this.nutritionService.listFoodItems();
      this.foodItems.set(items);
    } catch {
      // ignore
    }
  }
}
