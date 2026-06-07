import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'lib-auth-data-access';
import { getErrorMessage } from '../auth-error.util';
import { I18nService } from 'lib-i18n';

@Component({
  selector: 'lib-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.page.html',
  styleUrl: '../auth-page.scss',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(I18nService);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly registerForm = this.fb.nonNullable.group({
    inviteCode: ['', [Validators.required, Validators.minLength(8)]],
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);
    try {
      await this.authService.register(this.registerForm.getRawValue());
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.serverError.set(getErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }
}
