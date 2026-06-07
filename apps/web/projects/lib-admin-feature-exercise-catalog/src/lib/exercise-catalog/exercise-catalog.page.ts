import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TrainingService, ExerciseDto, MuscleGroup, ExerciseCategory, EquipmentType } from 'lib-training-data-access';
import { I18nService } from 'lib-i18n';

@Component({
  selector: 'lib-exercise-catalog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './exercise-catalog.page.html',
  styleUrls: ['./exercise-catalog.page.scss'],
})
export class ExerciseCatalogPage implements OnInit {
  private readonly trainingService = inject(TrainingService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly i18n = inject(I18nService);

  // Data
  protected exercises = signal<ExerciseDto[]>([]);
  protected showAddForm = false;
  protected editingExerciseId: string | null = null;
  protected exerciseForm: FormGroup;

  protected readonly displayedColumns: string[] = ['name', 'muscleGroup', 'category', 'actions'];

  protected readonly categories: ExerciseCategory[] = ['strength', 'cardio', 'flexibility', 'other'];
  protected readonly muscleGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'abs', 'glutes', 'quads', 'hamstrings', 'calves', 'full-body', 'cardio'
  ];
  protected readonly equipmentTypes: EquipmentType[] = [
    'barbell', 'dumbbell', 'machine', 'bodyweight', 'cable', 'other'
  ];

  constructor() {
    this.exerciseForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      category: ['strength' as ExerciseCategory, Validators.required],
      muscleGroup: ['chest' as MuscleGroup, Validators.required],
      equipmentType: ['other' as EquipmentType],
    });
  }

  ngOnInit(): void {
    this.loadCatalog();
  }

  protected async loadCatalog(): Promise<void> {
    try {
      const list = await this.trainingService.listCatalog();
      this.exercises.set(list);
    } catch (error) {
      this.snackBar.open('Katalog konnte nicht geladen werden', 'OK', { duration: 3000 });
    }
  }

  protected async saveExercise(): Promise<void> {
    if (this.exerciseForm.invalid) return;

    const data = this.exerciseForm.value;
    try {
      if (this.editingExerciseId) {
        await this.trainingService.updateCatalogExercise(this.editingExerciseId, data);
        this.snackBar.open('Übung aktualisiert', 'OK', { duration: 2000 });
      } else {
        await this.trainingService.createCatalogExercise(data);
        this.snackBar.open('Übung erstellt', 'OK', { duration: 2000 });
      }
      this.resetForm();
      await this.loadCatalog();
    } catch (error) {
      this.snackBar.open('Fehler beim Speichern', 'OK', { duration: 3000 });
    }
  }

  protected editExercise(exercise: ExerciseDto): void {
    this.editingExerciseId = exercise.id;
    this.exerciseForm.patchValue({
      name: exercise.name,
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      equipmentType: exercise.equipmentType,
    });
    this.showAddForm = true;
  }

  protected async deleteExercise(id: string): Promise<void> {
    if (!confirm('Übung wirklich löschen?')) return;
    try {
      await this.trainingService.deleteCatalogExercise(id);
      this.snackBar.open('Übung gelöscht', 'OK', { duration: 2000 });
      await this.loadCatalog();
    } catch (error) {
      this.snackBar.open('Fehler beim Löschen', 'OK', { duration: 3000 });
    }
  }

  private resetForm(): void {
    this.exerciseForm.reset({
      category: 'strength',
      muscleGroup: 'chest',
      equipmentType: 'other',
    });
    this.editingExerciseId = null;
    this.showAddForm = false;
  }
}
