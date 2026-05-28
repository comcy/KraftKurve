# User Story: Training Tracker Application

As an athlete, I want to log my workouts and see my previous performance so that I can track my progress effectively.

## Description
The Training Tracker is a comprehensive suite for planning, executing, and analyzing fitness activities. It supports structured multi-week plans, real-time tracking with high-performance UI, and intelligent progression suggestions.

## Core Features

### 1. Training Plans & Routines
- **Time-bound Plans**: Users can start plans with a defined duration (e.g., 4-12 weeks).
- **Predefined Routines**: A plan consists of specific routines (e.g., "Push A", "Legs B").
- **Flexible Execution**: Users can start sessions from a routine or perform "Free Workouts" on-the-fly.
- **Plan Management**: Active plans can be edited, cancelled, or extended.

### 2. Real-time Tracking (Workout Session)
- **Stopwatch**: Automated session timer starts on entry and stops on completion.
- **Dynamic Exercises**: Supports both **Strength** (Reps/Weight) and **Cardio** (Time/Distance) exercises with specialized entry forms.
- **Immersive UI**: Optimized for gym environments with large touch targets and minimal typing.
- **Workout Editing**: Live reordering of exercises and ability to assign free workouts to a plan mid-session.

### 3. Virtual Trainer (Progression IQ)
- **Last Time Orientation**: Displays the exact performance from the previous instance of the exercise.
- **Intelligence Strategy**: Suggests a "Next Goal" based on user-defined strategies in Settings:
  - **Weight-focused**: Prioritizes increasing weight (Progressive Overload).
  - **Rep-focused**: Prioritizes reaching the top of a rep range before increasing weight.
- **Historical Analysis**: Integrated view of progression trends.

## Acceptance Criteria

### Functional
- [x] **Plan Creation**: Define start/end dates and routine templates.
- [ ] **Active Session**: Start stopwatch and log sets/records.
- [ ] **Cardio Support**: Dedicated fields for duration and distance.
- [x] **Virtual Trainer**: Dynamic goal suggestions in the session UI.
- [x] **Last Workout Widget**: Dashboard display of the most recent session with date and exercise count.
- [x] **Workout Intel Detail**: Deep-dive view of any past session via swipe-up bottom sheet, showing all exercises and sets performed.
- [ ] **Persistence**: Local-first logging with background synchronization.

### Non-Functional
- [x] **Brutalist Aesthetic**: Consistent with Tactical Logbook (Mono fonts, high contrast).
- [x] **Performant**: Zero-lag entry even with large historical datasets.
- [x] **Role-aware**: Admins can manage the global catalog; Users focus on personal tracking.
