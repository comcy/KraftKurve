import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { TrainingService, TrainingPlanDto } from 'lib-training-data-access';
import { TacticalDialogComponent } from '../../../core/components/tactical-dialog/tactical-dialog.component';
import { I18nService } from 'lib-i18n';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './plan-list.component.html',
  styleUrl: './plan-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanListComponent implements OnInit {
  private readonly trainingApi = inject(TrainingService);
  private readonly router = inject(Router);
  private readonly _dialog = inject(MatDialog);
  protected readonly i18n = inject(I18nService);

  protected readonly plans = signal<TrainingPlanDto[]>([]);
  protected readonly loading = signal(false);

  async ngOnInit() {
    await this.loadPlans();
  }

  async loadPlans() {
    this.loading.set(true);
    try {
      const list = await this.trainingApi.listPlans();
      const today = new Date().toISOString().split('T')[0];
      
      // Chronological Sorting: Active first, then Future, then Past/Inactive
      const sorted = list.sort((a, b) => {
        const aStatus = this.getPlanStatusValue(a, today);
        const bStatus = this.getPlanStatusValue(b, today);
        
        if (aStatus !== bStatus) return aStatus - bStatus;
        return b.startDate.localeCompare(a.startDate); // newest start first within same status
      });

      this.plans.set(sorted);
    } catch {
      // ignore
    } finally {
      this.loading.set(false);
    }
  }

  getPlanStatus(plan: TrainingPlanDto): 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'OFFLINE' {
    if (!plan.active) return 'OFFLINE';
    const today = new Date().toISOString().split('T')[0];
    if (plan.startDate > today) return 'UPCOMING';
    if (plan.endDate < today) return 'EXPIRED';
    return 'ACTIVE';
  }

  private getPlanStatusValue(plan: TrainingPlanDto, today: string): number {
    if (!plan.active) return 4;
    if (plan.startDate <= today && plan.endDate >= today) return 1; // ACTIVE
    if (plan.startDate > today) return 2; // UPCOMING
    return 3; // EXPIRED
  }

  async createPlan() {
    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'INITIALIZE PLAN',
        message: 'Enter parameters for the new training protocol.',
        fields: [
          { key: 'name', type: 'text', label: 'PROTOCOL NAME', placeholder: 'E.G. 8 WEEK HYPERTROPHY' },
          { key: 'sessionsPerWeek', type: 'number', label: 'SESSIONS PER WEEK', value: 3 },
          { key: 'startDate', type: 'date', label: 'START DATE', value: new Date().toISOString().split('T')[0] },
          { key: 'endDate', type: 'date', label: 'END DATE', value: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
        ],
        confirmLabel: 'INITIALIZE'
      },
      panelClass: 'kk-dialog-panel'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result && result.name) {
      try {
        const plan = await this.trainingApi.createPlan({
          name: result.name,
          sessionsPerWeek: parseInt(result.sessionsPerWeek) || 3,
          startDate: result.startDate,
          endDate: result.endDate,
          active: true
        });
        await this.router.navigate(['/training/plans', plan.id]);
      } catch {
        // ignore
      }
    }
  }

  async deletePlan(event: Event, id: string) {
    event.stopPropagation();
    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'DESTROY PROTOCOL',
        message: 'Are you sure you want to permanently delete this plan and all associated routines?',
        confirmLabel: 'DESTROY'
      },
      panelClass: 'kk-dialog-panel'
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await this.trainingApi.deletePlan(id);
        await this.loadPlans();
      } catch {
        // ignore
      }
    }
  }
}
