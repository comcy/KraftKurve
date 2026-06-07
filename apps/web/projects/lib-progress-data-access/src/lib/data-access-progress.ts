import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MuscleGroup } from 'lib-training-data-access';

export type { MuscleGroup };

export interface BodyHeatmapEntryDto {
  totalSets: number;
  completedSets: number;
  sessionCount: number;
}

export interface BodyHeatmapInsightDto {
  days: number;
  totalSets: number;
  totalCompletedSets: number;
  muscles: Record<MuscleGroup, BodyHeatmapEntryDto>;
}

export interface WorkoutCalendarDayDto {
  date: string;
  sessionCount: number;
  templates: string[];
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api/training';

  async getBodyHeatmap(days: number): Promise<BodyHeatmapInsightDto> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ heatmap: BodyHeatmapInsightDto }>(`${this.apiBase}/progress/heatmap`, {
          params: { days },
        }),
      );
      return res.heatmap;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async getWorkoutCalendar(days: number): Promise<WorkoutCalendarDayDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ calendar: WorkoutCalendarDayDto[] }>(`${this.apiBase}/progress/calendar`, {
          params: { days },
        }),
      );
      return res.calendar;
    } catch (error) {
      throw this.toError(error);
    }
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error('Request failed');
  }
}
