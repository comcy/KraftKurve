import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'lib-auth-data-access';
import { NutritionService } from 'lib-nutrition-data-access';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
})
export class ProfilePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly nutritionService = inject(NutritionService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly displayName = signal('');
  protected readonly email = signal('');
  protected readonly proteinGoalDraft = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    const user = this.authService.getCurrentUser();
    this.displayName.set(user?.displayName ?? '');
    this.email.set(user?.email ?? '');

    if (user?.role === 'admin') {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const goal = await this.nutritionService.getProteinGoal();
      this.proteinGoalDraft.set(goal.proteinGoalG);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Profil konnte nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }

  protected isAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'admin';
  }

  protected async saveGoal(event: Event): Promise<void> {
    event.preventDefault();
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const value = this.proteinGoalDraft();
      if (value !== null && (Number.isNaN(value) || value < 1 || value > 9999)) {
        this.error.set('Ziel muss zwischen 1g und 9999g sein.');
        return;
      }

      await this.nutritionService.setProteinGoal(value);
      this.success.set('Ernaehrungsziel gespeichert.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Speichern fehlgeschlagen.');
    } finally {
      this.saving.set(false);
    }
  }

  protected clearGoal(): void {
    this.proteinGoalDraft.set(null);
  }
}
