import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { I18nService } from 'lib-i18n';
import { ProgressService, BodyHeatmapInsightDto, WorkoutCalendarDayDto, MuscleGroup } from 'lib-progress-data-access';

type Timeframe = 28 | 90;

interface CalendarCell {
  date: string;
  sessionCount: number;
  templates: string[];
  inRange: boolean;
  isToday: boolean;
}

interface MuscleRow {
  key: MuscleGroup;
  label: string;
  sessionCount: number;
  completedSets: number;
  pct: number;
}

const MUSCLE_ORDER: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'glutes', 'quads', 'hamstrings', 'calves', 'legs', 'full-body', 'cardio',
];

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'CHEST', back: 'BACK', shoulders: 'SHLD', biceps: 'BIC',
  triceps: 'TRI', forearms: 'FORE', abs: 'ABS', glutes: 'GLUT',
  quads: 'QUAD', hamstrings: 'HAM', calves: 'CALV', legs: 'LEGS',
  'full-body': 'FULL', cardio: 'CARD',
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

@Component({
  selector: 'lib-progress-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress-page">
      <div class="page-header">
        <h1 class="headline-lg">{{ i18n.t('progress.title') }}</h1>
        <div class="timeframe-toggle">
          <button class="tf-btn" [class.active]="timeframe() === 28" (click)="setTimeframe(28)">28D</button>
          <button class="tf-btn" [class.active]="timeframe() === 90" (click)="setTimeframe(90)">90D</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state label-caps">{{ i18n.t('progress.loading') }}</div>
      } @else {
        <div class="log-card">
          <div class="log-header tape">
            <span class="label-caps">{{ i18n.t('progress.calendarTitle') }}</span>
            <span class="data-mono">{{ totalSessions() }} {{ i18n.t('progress.sessions') }}</span>
          </div>
          <div class="calendar-body">
            <div class="calendar-layout">
              <div class="day-labels-col">
                <div class="month-spacer"></div>
                @for (label of dayLabels; track $index) {
                  <div class="day-label">{{ label }}</div>
                }
              </div>
              <div class="weeks-scroll">
                <div class="month-labels-row">
                  @for (label of monthLabels(); track $index) {
                    <div class="month-label">{{ label }}</div>
                  }
                </div>
                @for (dayIdx of [0,1,2,3,4,5,6]; track dayIdx) {
                  <div class="cal-row">
                    @for (week of calendarGrid(); track $index) {
                      <div
                        [class]="cellClass(week[dayIdx])"
                        [title]="week[dayIdx].date + (week[dayIdx].sessionCount > 0 ? ' · ' + week[dayIdx].sessionCount + (week[dayIdx].sessionCount === 1 ? ' session' : ' sessions') : '')">
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
            <div class="legend">
              <div class="legend-item"><span class="legend-dot cell-push"></span><span>PUSH</span></div>
              <div class="legend-item"><span class="legend-dot cell-pull"></span><span>PULL</span></div>
              <div class="legend-item"><span class="legend-dot cell-legs"></span><span>LEGS</span></div>
              <div class="legend-item"><span class="legend-dot cell-full-body"></span><span>FULL</span></div>
              <div class="legend-item"><span class="legend-dot cell-cardio"></span><span>CARDIO</span></div>
              <div class="legend-item"><span class="legend-dot cell-custom"></span><span>OTHER</span></div>
            </div>
          </div>
        </div>

        <div class="log-card">
          <div class="log-header tape">
            <span class="label-caps">{{ i18n.t('progress.muscleLoad') }}</span>
            <span class="data-mono">{{ i18n.t('progress.last') }} {{ timeframe() }}D</span>
          </div>
          <div class="muscle-list">
            @for (row of muscleRows(); track row.key) {
              <div class="muscle-row">
                <span class="muscle-label">{{ row.label }}</span>
                <div class="muscle-bar-track">
                  <div class="muscle-bar-fill"
                       [style.width.%]="row.pct"
                       [class.bar-warm]="row.pct > 0 && row.pct <= 50"
                       [class.bar-hot]="row.pct > 50">
                  </div>
                </div>
                <span class="muscle-count data-mono">{{ row.sessionCount }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --cell: 13px;
      --gap: 2px;
    }

    .progress-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0 80px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      gap: 12px;
    }

    .headline-lg {
      font-size: 10px;
      line-height: 1.4;
    }

    .timeframe-toggle {
      display: flex;
      border: 1px solid var(--border, #444);
    }

    .tf-btn {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 4px 10px;
      border: none;
      background: transparent;
      color: var(--text-secondary, #888);
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tf-btn.active {
      background: var(--primary, #fdff00);
      color: #000;
    }

    .loading-state {
      padding: 48px 16px;
      text-align: center;
      color: var(--text-secondary, #888);
      font-size: 10px;
    }

    .log-card {
      margin: 0 16px;
      border: 1px solid var(--border, #444);
    }

    .log-header.tape {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background: var(--surface-alt, #1e1e1e);
      border-bottom: 1px solid var(--border, #444);
      font-size: 9px;
    }

    .calendar-body {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .calendar-layout {
      display: flex;
      gap: 4px;
      overflow-x: auto;
    }

    .day-labels-col {
      display: flex;
      flex-direction: column;
      gap: var(--gap);
      flex-shrink: 0;
    }

    .month-spacer { height: 14px; }

    .day-label {
      width: 10px;
      height: var(--cell);
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      color: var(--text-secondary, #888);
      display: flex;
      align-items: center;
    }

    .weeks-scroll {
      display: flex;
      flex-direction: column;
      gap: var(--gap);
      overflow-x: auto;
    }

    .month-labels-row {
      display: flex;
      gap: var(--gap);
      height: 14px;
    }

    .month-label {
      width: var(--cell);
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      color: var(--text-secondary, #888);
      white-space: nowrap;
      overflow: visible;
    }

    .cal-row { display: flex; gap: var(--gap); }

    .cell-oob  { width: var(--cell); height: var(--cell); border: 1px solid transparent; flex-shrink: 0; }
    .cell-empty { width: var(--cell); height: var(--cell); border: 1px solid var(--border, #333); background: transparent; flex-shrink: 0; }
    .cell-push  { width: var(--cell); height: var(--cell); background: var(--primary, #fdff00);   border: 1px solid var(--primary, #fdff00);   flex-shrink: 0; }
    .cell-pull  { width: var(--cell); height: var(--cell); background: var(--secondary, #ff00ff); border: 1px solid var(--secondary, #ff00ff); flex-shrink: 0; }
    .cell-legs  { width: var(--cell); height: var(--cell); background: var(--tertiary, #00ff41);  border: 1px solid var(--tertiary, #00ff41);  flex-shrink: 0; }
    .cell-full-body { width: var(--cell); height: var(--cell); background: #ffffff; border: 1px solid #ffffff; flex-shrink: 0; }
    .cell-cardio    { width: var(--cell); height: var(--cell); background: #ff9100; border: 1px solid #ff9100; flex-shrink: 0; }
    .cell-custom    { width: var(--cell); height: var(--cell); background: #666666; border: 1px solid #666666; flex-shrink: 0; }
    .is-today { box-shadow: 0 0 0 1px #fff inset; }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      padding-top: 4px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary, #888);
    }

    .legend-dot { display: inline-block; width: 8px; height: 8px; }

    .muscle-list {
      display: flex;
      flex-direction: column;
      padding: 8px 10px;
      gap: 6px;
    }

    .muscle-row { display: flex; align-items: center; gap: 8px; }

    .muscle-label {
      width: 36px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-secondary, #888);
      flex-shrink: 0;
    }

    .muscle-bar-track {
      flex: 1;
      height: 6px;
      background: var(--surface-alt, #1e1e1e);
      border: 1px solid var(--border, #333);
    }

    .muscle-bar-fill {
      height: 100%;
      background: var(--border, #444);
      transition: width 0.3s ease;
    }

    .bar-warm { background: var(--primary, #fdff00); }
    .bar-hot  { background: var(--tertiary, #00ff41); }

    .muscle-count {
      width: 16px;
      text-align: right;
      font-size: 10px;
      color: var(--text-primary, #fff);
    }
  `],
})
export class ProgressOverviewComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  private readonly progressService = inject(ProgressService);

  protected readonly loading = signal(true);
  protected readonly timeframe = signal<Timeframe>(90);
  private readonly heatmapData = signal<BodyHeatmapInsightDto | null>(null);
  private readonly calendarRaw = signal<WorkoutCalendarDayDto[]>([]);

  protected readonly dayLabels = DAY_LABELS;

  protected readonly calendarGrid = computed((): CalendarCell[][] => {
    const days = this.timeframe();
    const raw = this.calendarRaw();
    const dataMap = new Map(raw.map(d => [d.date, d]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));

    const startDow = (startDate.getDay() + 6) % 7;
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - startDow);

    const endDow = (today.getDay() + 6) % 7;
    const gridEnd = new Date(today);
    gridEnd.setDate(gridEnd.getDate() + (6 - endDow));

    const totalDays = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    const weeks: CalendarCell[][] = [];
    const cur = new Date(gridStart);
    for (let w = 0; w < totalWeeks; w++) {
      const week: CalendarCell[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cur.toISOString().slice(0, 10);
        const inRange = cur >= startDate && cur <= today;
        const entry = dataMap.get(dateStr);
        week.push({
          date: dateStr,
          sessionCount: inRange ? (entry?.sessionCount ?? 0) : 0,
          templates: entry?.templates ?? [],
          inRange,
          isToday: cur.getTime() === today.getTime(),
        });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  });

  protected readonly monthLabels = computed((): string[] => {
    const grid = this.calendarGrid();
    let lastMonth = -1;
    return grid.map(week => {
      const d = new Date(week[0].date);
      const m = d.getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        return d.toLocaleString('en', { month: 'short' }).toUpperCase();
      }
      return '';
    });
  });

  protected readonly totalSessions = computed(() =>
    this.calendarRaw().reduce((sum, d) => sum + d.sessionCount, 0),
  );

  protected readonly muscleRows = computed((): MuscleRow[] => {
    const data = this.heatmapData();
    if (!data) return [];
    const maxSessions = Math.max(
      ...MUSCLE_ORDER.map(m => data.muscles[m]?.sessionCount ?? 0),
      1,
    );
    return MUSCLE_ORDER.map(key => {
      const entry = data.muscles[key];
      const sessionCount = entry?.sessionCount ?? 0;
      return {
        key,
        label: MUSCLE_LABELS[key],
        sessionCount,
        completedSets: entry?.completedSets ?? 0,
        pct: Math.round((sessionCount / maxSessions) * 100),
      };
    });
  });

  async ngOnInit() {
    await this.loadData();
  }

  protected async setTimeframe(t: Timeframe) {
    this.timeframe.set(t);
    await this.loadData();
  }

  protected cellClass(cell: CalendarCell): string {
    if (!cell.inRange) return 'cell-oob';
    if (cell.sessionCount === 0) return 'cell-empty';
    const template = cell.templates[0] ?? 'custom';
    const todayClass = cell.isToday ? ' is-today' : '';
    return `cell-${template}${todayClass}`;
  }

  private async loadData() {
    this.loading.set(true);
    try {
      const days = this.timeframe();
      const [heatmap, calendar] = await Promise.all([
        this.progressService.getBodyHeatmap(days),
        this.progressService.getWorkoutCalendar(days),
      ]);
      this.heatmapData.set(heatmap);
      this.calendarRaw.set(calendar);
    } finally {
      this.loading.set(false);
    }
  }
}
