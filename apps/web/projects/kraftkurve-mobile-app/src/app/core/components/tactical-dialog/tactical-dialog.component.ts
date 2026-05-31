import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule } from '@angular/forms';

export interface TacticalDialogField {
  key: string;
  type: 'text' | 'number' | 'date' | 'select';
  label: string;
  placeholder?: string;
  value?: any;
  options?: { label: string; value: any }[];
  autocompleteOptions?: string[];
}

export interface TacticalDialogData {
  title: string;
  message?: string;
  fields?: TacticalDialogField[];
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-tactical-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    FormsModule
  ],
  template: `
    <div class="log-card tactical-dialog-card">
      <div class="log-header tape">
        <span class="label-caps">{{ data.title }}</span>
      </div>
      
      <div class="log-content">
        @if (data.message) {
          <p class="dialog-message label-caps">{{ data.message }}</p>
        }

        <div class="fields-container" *ngIf="data.fields">
          @for (field of data.fields; track field.key) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label class="label-caps">{{ field.label }}</mat-label>
              
              @if (field.type === 'select') {
                <mat-select [(ngModel)]="formValues[field.key]">
                  @for (opt of field.options; track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              } @else if (field.autocompleteOptions) {
                <input matInput type="text" [(ngModel)]="formValues[field.key]" [matAutocomplete]="auto" [placeholder]="field.placeholder || ''" class="data-mono">
                <mat-autocomplete #auto="matAutocomplete">
                  @for (opt of getFilteredOptions(field); track opt) {
                    <mat-option [value]="opt">{{ opt }}</mat-option>
                  }
                </mat-autocomplete>
              } @else {
                <input matInput [type]="field.type" [(ngModel)]="formValues[field.key]" [placeholder]="field.placeholder || ''" class="data-mono">
              }
            </mat-form-field>
          }
        </div>

        <div class="actions">
          <button mat-button class="label-caps" (click)="onCancel()">
            {{ data.cancelLabel || 'ABORT' }}
          </button>
          <button mat-flat-button color="primary" class="label-caps" (click)="onConfirm()">
            {{ data.confirmLabel || 'EXECUTE' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tactical-dialog-card {
      margin: 0;
      border: 2px solid var(--primary);
    }
    
    .dialog-message {
      font-size: 10px;
      line-height: 1.6;
      margin-bottom: 24px;
      opacity: 0.8;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .fields-container {
      margin-bottom: 8px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    .label-caps {
      letter-spacing: 1px;
    }
  `]
})
export class TacticalDialogComponent {
  protected readonly data = inject<TacticalDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TacticalDialogComponent>);
  
  protected formValues: Record<string, any> = {};

  constructor() {
    if (this.data.fields) {
      this.data.fields.forEach(f => {
        this.formValues[f.key] = f.value !== undefined ? f.value : '';
      });
    }
  }

  onConfirm(): void {
    if (this.data.fields) {
      this.dialogRef.close(this.formValues);
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getFilteredOptions(field: TacticalDialogField): string[] {
    const val = (this.formValues[field.key] || '').toLowerCase();
    return (field.autocompleteOptions || []).filter(o => o.toLowerCase().includes(val));
  }
}
