import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

interface TrainingSet {
  id: number;
  weight: number;
  weightLabel?: string;
  reps: number;
  completed: boolean;
}

interface StandardExercise {
  id: number;
  name: string;
  setsCount: number;
  type: 'standard';
  sets: TrainingSet[];
}

interface SupersetExercise {
  id: number;
  name: string;
  type: 'superset';
  exercises: {
    id: string;
    name: string;
    sets: TrainingSet[];
  }[];
}

type Exercise = StandardExercise | SupersetExercise;

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatRippleModule],
  templateUrl: './training.html',
  styleUrl: './training.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingComponent {
  protected readonly workoutTitle = 'Hypertrophy Block D3';
  protected readonly workoutSubtitle = 'Chest & Triceps Focus';
  protected readonly duration = 45;
  protected readonly unitMin = 'MIN';
  protected readonly supersetLabel = 'SUPERSET';
  protected readonly addSet = 'ADD SET';
  protected readonly finishWorkout = 'FINISH WORKOUT';

  // Mock data for exercises
  protected readonly exercises: Exercise[] = [
    {
      id: 1,
      name: 'Barbell Bench Press',
      setsCount: 3,
      type: 'standard',
      sets: [
        { id: 1, weight: 100, reps: 8, completed: true },
        { id: 2, weight: 100, reps: 8, completed: false }
      ]
    },
    {
      id: 2,
      name: 'Superset A/B',
      type: 'superset',
      exercises: [
        {
          id: '2A',
          name: 'Incline DB Flyes',
          sets: [{ id: 1, weight: 20, reps: 12, completed: true }]
        },
        {
          id: '2B',
          name: 'Pushups (AMRAP)',
          sets: [{ id: 1, weight: 0, weightLabel: 'BW', reps: 22, completed: true }]
        }
      ]
    }
  ];

  protected toggleSet(exerciseId: number | string, setId: number) {
    // Logic to toggle set completion
  }
}
