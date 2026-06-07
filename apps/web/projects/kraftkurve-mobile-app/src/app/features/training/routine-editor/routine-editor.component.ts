import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { firstValueFrom, Observable, map, startWith } from 'rxjs';
import { TrainingService, TrainingRoutineExerciseDto, ExerciseDto, TrainingRoutineDto } from 'lib-training-data-access';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { TacticalDialogComponent } from '../../../core/components/tactical-dialog/tactical-dialog.component';
import { I18nService } from 'lib-i18n';

@Component({
  selector: 'app-routine-editor',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule, 
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    DragDropModule
  ],
  templateUrl: './routine-editor.component.html',
  styleUrl: './routine-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoutineEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly trainingApi = inject(TrainingService);
  private readonly _dialog = inject(MatDialog);
  protected readonly i18n = inject(I18nService);

  protected readonly routine = signal<TrainingRoutineDto | null>(null);
  protected readonly exercises = signal<TrainingRoutineExerciseDto[]>([]);
  protected readonly catalog = signal<ExerciseDto[]>([]);
  protected readonly loading = signal(false);
  
  protected planId = '';
  protected routineId = '';

  protected searchControl = new FormControl('');
  protected filteredCatalog!: Observable<ExerciseDto[]>;

  protected readonly groupedExercises = computed(() => {
    const list = this.exercises();
    const groups: Array<{ type: 'single' | 'superset', exercises: TrainingRoutineExerciseDto[] }> = [];
    
    for (let i = 0; i < list.length; i++) {
      const current = list[i];
      if (current.supersetGroupId) {
        const existingGroup = groups.find(g => g.type === 'superset' && g.exercises[0].supersetGroupId === current.supersetGroupId);
        if (existingGroup) {
          existingGroup.exercises.push(current);
        } else {
          groups.push({ type: 'superset', exercises: [current] });
        }
      } else {
        groups.push({ type: 'single', exercises: [current] });
      }
    }
    return groups;
  });

  async ngOnInit() {
    this.planId = this.route.snapshot.paramMap.get('id') ?? '';
    this.routineId = this.route.snapshot.paramMap.get('routineId') ?? '';
    
    if (this.routineId) {
      await Promise.all([this.loadRoutine(), this.loadExercises(), this.loadCatalog()]);
      
      this.filteredCatalog = this.searchControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value || ''))
      );
    }
  }

  private _filter(value: string | ExerciseDto | null): ExerciseDto[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    const existingNames = this.exercises().map(e => e.exerciseName.toLowerCase());
    
    return this.catalog().filter(option => 
      option.name.toLowerCase().includes(filterValue) && 
      !existingNames.includes(option.name.toLowerCase())
    );
  }

  async loadRoutine() {
    try {
      const r = await this.trainingApi.getRoutine(this.routineId);
      this.routine.set(r);
    } catch {
      // ignore
    }
  }

  async loadExercises() {
    this.loading.set(true);
    try {
      const list = await this.trainingApi.listRoutineExercises(this.routineId);
      this.exercises.set(list);
    } catch {
      // ignore
    } finally {
      this.loading.set(false);
    }
  }

  async loadCatalog() {
    try {
      const list = await this.trainingApi.listCatalog();
      this.catalog.set(list);
    } catch {
      // ignore
    }
  }

  async renameRoutine() {
    const r = this.routine();
    if (!r) return;

    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'RENAME ROUTINE',
        message: 'Update the name of this routine.',
        fields: [
          { key: 'name', type: 'text', label: 'ROUTINE NAME', value: r.name }
        ],
        confirmLabel: 'UPDATE'
      },
      panelClass: 'kk-dialog-panel'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result && result.name && result.name.trim()) {
      try {
        const updated = await this.trainingApi.updateRoutine(this.routineId, result.name.trim());
        this.routine.set(updated);
      } catch {
        // ignore
      }
    }
  }

  async addExercise(ex: ExerciseDto) {
    const existingNames = this.exercises().map(e => e.exerciseName.toLowerCase());
    if (existingNames.includes(ex.name.toLowerCase())) return;

    try {
      const newEx = await this.trainingApi.addRoutineExercise(this.routineId, {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        suggestedSets: 3
      });
      this.exercises.update(list => [...list, newEx]);
      this.searchControl.setValue('');
    } catch {
      // ignore
    }
  }

  async removeExercise(id: string) {
    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'DETACH EXERCISE',
        message: 'Remove this exercise from the routine stack?',
        confirmLabel: 'DETACH'
      },
      panelClass: 'kk-dialog-panel'
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (!confirmed) return;

    try {
      await this.trainingApi.deleteRoutineExercise(id);
      this.exercises.update(list => list.filter(e => e.id !== id));
    } catch {
      // ignore
    }
  }

  async createCustomExercise() {
    const searchValue = typeof this.searchControl.value === 'string' ? this.searchControl.value : '';
    
    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'NEW ATTACHMENT',
        message: 'Define a custom exercise for this routine.',
        fields: [
          { key: 'name', type: 'text', label: 'EXERCISE NAME', placeholder: 'E.G. DIAMOND PUSHUPS', value: searchValue },
          { 
            key: 'muscleGroup', 
            type: 'select', 
            label: 'TARGET MUSCLE', 
            value: 'full-body',
            options: [
              { label: 'CHEST', value: 'chest' },
              { label: 'BACK', value: 'back' },
              { label: 'SHOULDERS', value: 'shoulders' },
              { label: 'BICEPS', value: 'biceps' },
              { label: 'TRICEPS', value: 'triceps' },
              { label: 'LEGS', value: 'legs' },
              { label: 'ABS', value: 'abs' },
              { label: 'FULL BODY', value: 'full-body' }
            ]
          }
        ],
        confirmLabel: 'CREATE'
      },
      panelClass: 'kk-dialog-panel'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result && result.name) {
      const existingNames = this.exercises().map(e => e.exerciseName.toLowerCase());
      if (existingNames.includes(result.name.trim().toLowerCase())) return;

      const newEx = await this.trainingApi.addRoutineExercise(this.routineId, {
        exerciseName: result.name,
        muscleGroup: result.muscleGroup,
        suggestedSets: 3
      });
      this.exercises.update(list => [...list, newEx]);
      await this.loadCatalog(); // Refresh catalog for autocomplete
      this.searchControl.setValue('');
    }
  }

  async onDrop(event: CdkDragDrop<TrainingRoutineExerciseDto[]>) {
    const list = [...this.exercises()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.exercises.set(list);
    
    // Save new order to backend
    for (let i = 0; i < list.length; i++) {
      await this.trainingApi.updateRoutineExercise(list[i].id, { order: i + 1 });
    }
  }

  async toggleSuperset(index: number) {
    const list = [...this.exercises()];
    const current = list[index];
    const next = list[index + 1];

    if (!next) return; 

    if (current.supersetGroupId && current.supersetGroupId === next.supersetGroupId) {
      await this.trainingApi.updateRoutineExercise(current.id, { supersetGroupId: null });
      await this.trainingApi.updateRoutineExercise(next.id, { supersetGroupId: null });
      current.supersetGroupId = null;
      next.supersetGroupId = null;
    } else {
      const newId = uuidv4();
      await this.trainingApi.updateRoutineExercise(current.id, { supersetGroupId: newId });
      await this.trainingApi.updateRoutineExercise(next.id, { supersetGroupId: newId });
      current.supersetGroupId = newId;
      next.supersetGroupId = newId;
    }
    this.exercises.set(list);
  }

  isSupersetWithNext(index: number): boolean {
    const list = this.exercises();
    return !!(list[index].supersetGroupId && list[index + 1] && list[index].supersetGroupId === list[index + 1].supersetGroupId);
  }

  isSupersetWithPrev(index: number): boolean {
    const list = this.exercises();
    return !!(list[index].supersetGroupId && list[index - 1] && list[index].supersetGroupId === list[index - 1].supersetGroupId);
  }
}
