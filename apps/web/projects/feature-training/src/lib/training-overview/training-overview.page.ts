import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CreateTrainingPlanTemplateRequest,
  OfflineQueueDeadLetter,
  TrainingPlanTemplateDto,
  TrainingService,
  TrainingSessionDto,
  WorkoutTemplate,
} from 'data-access-training';

@Component({
  selector: 'lib-training-overview',
  imports: [RouterLink],
  template: `
    <main style="max-width:920px;padding:2rem;margin:0 auto;display:grid;gap:1rem">
      <section style="display:flex;justify-content:space-between;align-items:center;gap:0.8rem;flex-wrap:wrap">
        <h2 style="margin:0">Training</h2>
        <a routerLink="new">+ Neues Training</a>
      </section>

      @if (error()) {
        <p style="margin:0;color:#b42318">{{ error() }}</p>
      }

      <section style="border:1px solid #ddd;border-radius:0.7rem;padding:0.8rem;display:grid;gap:0.6rem">
        <h3 style="margin:0">Offline Queue</h3>
        <p style="margin:0">Queue: {{ queueSize() }} | Dead letters: {{ deadLetters().length }}</p>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button type="button" (click)="onFlushQueue()">Queue jetzt syncen</button>
          <button type="button" (click)="onClearDeadLetters()" [disabled]="!deadLetters().length">
            Dead letters leeren
          </button>
        </div>

        @if (deadLetters().length) {
          <ul style="margin:0;padding-left:1rem;display:grid;gap:0.3rem">
            @for (entry of deadLetters(); track entry.operation.id) {
              <li>
                {{ entry.operation.method }} {{ entry.operation.url }}
                (status: {{ entry.status ?? 'n/a' }}, attempts: {{ entry.operation.attempts }})
              </li>
            }
          </ul>
        }
      </section>

      <section style="border:1px solid #ddd;border-radius:0.7rem;padding:0.8rem;display:grid;gap:0.6rem">
        <h3 style="margin:0">Trainingsplan Templates</h3>

        <form (submit)="onCreateTemplate($event)" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:0.5rem;align-items:end">
          <label>
            Name
            <input name="name" type="text" required [value]="templateDraft().name" (input)="onTemplateDraftInput('name', $event)" />
          </label>

          <label>
            Typ
            <select name="templateType" [value]="templateDraft().templateType" (change)="onTemplateDraftInput('templateType', $event)">
              <option value="push">Push</option>
              <option value="pull">Pull</option>
              <option value="legs">Legs</option>
              <option value="full-body">Full Body</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label>
            Start
            <input name="startDate" type="date" required [value]="templateDraft().startDate" (input)="onTemplateDraftInput('startDate', $event)" />
          </label>

          <label>
            Ende
            <input name="endDate" type="date" required [value]="templateDraft().endDate" (input)="onTemplateDraftInput('endDate', $event)" />
          </label>

          <button type="submit">Template anlegen</button>
        </form>

        @if (!templates().length) {
          <p style="margin:0">Keine Templates vorhanden.</p>
        } @else {
          <ul style="margin:0;padding-left:1rem;display:grid;gap:0.35rem">
            @for (template of templates(); track template.id) {
              <li style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap">
                <span>
                  {{ template.name }} ({{ template.templateType }})
                  {{ template.startDate }} -> {{ template.endDate }}
                  @if (!template.active) {
                    [inactive]
                  }
                </span>
                <span style="display:flex;gap:0.4rem">
                  <button type="button" (click)="onToggleTemplateActive(template)">
                    @if (template.active) { deaktivieren } @else { aktivieren }
                  </button>
                  <button type="button" (click)="onDeleteTemplate(template.id)">loeschen</button>
                </span>
              </li>
            }
          </ul>
        }
      </section>

      <section>
        <h3>Sessions</h3>
        @if (loading()) {
          <p>Lade Sessions...</p>
        } @else if (!sessions().length) {
          <p>Noch keine Sessions vorhanden.</p>
        } @else {
          <ul>
            @for (session of sessions(); track session.id) {
              <li>
                <a [routerLink]="session.id">
                  {{ session.date }} - {{ session.templateType }}
                </a>
              </li>
            }
          </ul>
        }
      </section>
    </main>
  `,
})
export class TrainingOverviewPage implements OnInit {
  private readonly trainingService = inject(TrainingService);

  protected readonly sessions = signal<TrainingSessionDto[]>([]);
  protected readonly templates = signal<TrainingPlanTemplateDto[]>([]);
  protected readonly queueSize = signal(0);
  protected readonly deadLetters = signal<OfflineQueueDeadLetter[]>([]);
  protected readonly templateDraft = signal<CreateTrainingPlanTemplateRequest>({
    name: '',
    templateType: 'custom',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    reminderDaysBefore: 7,
    note: null,
    active: true,
  });
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadAll();
  }

  protected onTemplateDraftInput(
    key: 'name' | 'templateType' | 'startDate' | 'endDate',
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.templateDraft.update((draft) => ({
      ...draft,
      [key]: key === 'templateType' ? (value as WorkoutTemplate) : value,
    }));
  }

  protected async onCreateTemplate(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set(null);
    try {
      await this.trainingService.createTemplate(this.templateDraft());
      this.templateDraft.update((draft) => ({ ...draft, name: '' }));
      await this.loadTemplates();
      this.refreshQueueState();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Template konnte nicht erstellt werden.');
      this.refreshQueueState();
    }
  }

  protected async onToggleTemplateActive(template: TrainingPlanTemplateDto): Promise<void> {
    this.error.set(null);
    try {
      await this.trainingService.updateTemplate(template.id, { active: !template.active });
      await this.loadTemplates();
      this.refreshQueueState();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Template konnte nicht aktualisiert werden.');
      this.refreshQueueState();
    }
  }

  protected async onDeleteTemplate(templateId: string): Promise<void> {
    this.error.set(null);
    try {
      await this.trainingService.deleteTemplate(templateId);
      await this.loadTemplates();
      this.refreshQueueState();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Template konnte nicht geloescht werden.');
      this.refreshQueueState();
    }
  }

  protected async onFlushQueue(): Promise<void> {
    this.error.set(null);
    try {
      await this.trainingService.flushOfflineQueue();
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
      this.error.set(error instanceof Error ? error.message : 'Templates konnten nicht geladen werden.');
    }
  }

  private refreshQueueState(): void {
    this.queueSize.set(this.trainingService.getOfflineQueueSize());
    this.deadLetters.set(this.trainingService.getOfflineDeadLetters());
  }
}
