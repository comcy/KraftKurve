import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  OfflineQueueDeadLetter,
  TrainingPlanTemplateDto,
  TrainingService,
  TrainingSessionDto,
  WorkoutTemplate,
} from 'lib-training-data-access';

@Component({
  selector: 'lib-training-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './training-overview.page.html',
  styleUrl: './training-overview.page.scss',
})
export class TrainingOverviewPage implements OnInit {
  private readonly trainingService = inject(TrainingService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // Labels
  protected readonly labelTitle = 'Training';
  protected readonly labelNewSession = 'Neues Training';
  protected readonly labelOfflineQueue = 'Offline Synchronisierung';
  protected readonly labelTemplates = 'Trainingspläne';
  protected readonly labelSessions = 'Letzte Sessions';
  protected readonly labelCreateTemplate = 'Plan erstellen';
  protected readonly labelName = 'Name';
  protected readonly labelType = 'Typ';
  protected readonly labelStart = 'Start';
  protected readonly labelEnd = 'Ende';
  protected readonly labelSyncNow = 'Jetzt synchronisieren';
  protected readonly labelClearDeadLetters = 'Dead-Letters leeren';
  protected readonly labelEmptySessions = 'Noch keine Sessions vorhanden.';
  protected readonly labelEmptyTemplates = 'Keine Pläne vorhanden.';

  // Routes
  protected readonly routeNewSession = 'new';

  // Data
  protected readonly sessions = signal<TrainingSessionDto[]>([]);
  protected readonly templates = signal<TrainingPlanTemplateDto[]>([]);
  protected readonly queueSize = signal(0);
  protected readonly deadLetters = signal<OfflineQueueDeadLetter[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected templateForm: FormGroup;
  protected readonly workoutTypes: WorkoutTemplate[] = ['push', 'pull', 'legs', 'full-body', 'custom'];

  constructor() {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      templateType: ['custom' as WorkoutTemplate, Validators.required],
      startDate: [new Date().toISOString().slice(0, 10), Validators.required],
      endDate: [new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadAll();
  }

  protected async onCreateTemplate(): Promise<void> {
    if (this.templateForm.invalid) return;
    this.error.set(null);
    try {
      await this.trainingService.createTemplate(this.templateForm.value);
      this.templateForm.patchValue({ name: '' });
      this.snackBar.open('Trainingsplan erstellt', 'OK', { duration: 2000 });
      await this.loadTemplates();
      this.refreshQueueState();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Plan konnte nicht erstellt werden.');
    }
  }

  protected async onToggleTemplateActive(template: TrainingPlanTemplateDto): Promise<void> {
    this.error.set(null);
    try {
      await this.trainingService.updateTemplate(template.id, { active: !template.active });
      this.snackBar.open(template.active ? 'Plan deaktiviert' : 'Plan aktiviert', 'OK', { duration: 2000 });
      await this.loadTemplates();
      this.refreshQueueState();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Plan konnte nicht aktualisiert werden.');
    }
  }

  protected async onDeleteTemplate(templateId: string): Promise<void> {
    if (!confirm('Plan wirklich löschen?')) return;
    this.error.set(null);
    try {
      await this.trainingService.deleteTemplate(templateId);
      this.snackBar.open('Plan gelöscht', 'OK', { duration: 2000 });
      await this.loadTemplates();
      this.refreshQueueState();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Plan konnte nicht gelöscht werden.');
    }
  }

  protected async onFlushQueue(): Promise<void> {
    this.error.set(null);
    try {
      const flushed = await this.trainingService.flushOfflineQueue();
      this.snackBar.open(`${flushed} Aktionen synchronisiert`, 'OK', { duration: 2000 });
      this.refreshQueueState();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Queue-Sync fehlgeschlagen.');
      this.refreshQueueState();
    }
  }

  protected onClearDeadLetters(): void {
    this.trainingService.clearOfflineDeadLetters();
    this.refreshQueueState();
  }

  private async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await Promise.all([this.loadSessions(), this.loadTemplates()]);
    } finally {
      this.refreshQueueState();
      this.loading.set(false);
    }
  }

  private async loadSessions(): Promise<void> {
    try {
      this.sessions.set(await this.trainingService.listSessions());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Sessions konnten nicht geladen werden.');
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      this.templates.set(await this.trainingService.listTemplates());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Pläne konnten nicht geladen werden.');
    }
  }

  private refreshQueueState(): void {
    this.queueSize.set(this.trainingService.getOfflineQueueSize());
    this.deadLetters.set(this.trainingService.getOfflineDeadLetters());
  }
}
