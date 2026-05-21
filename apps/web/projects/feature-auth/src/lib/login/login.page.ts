import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, APP_ID, AppId } from 'data-access-auth';
import { getErrorMessage } from '../auth-error.util';

@Component({
  selector: 'lib-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrl: '../auth-page.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly appId = inject(APP_ID);
  private readonly fb = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);
    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.authService.login({ email, password });
      const user = this.authService.getCurrentUser();
      if (!this.isValidRole(user?.role)) {
        const expectedRoles = this.getExpectedRoles(this.appId);
        this.serverError.set(`Diese App ist für ${expectedRoles} reserviert.`);
        return;
      }
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.serverError.set(getErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private isValidRole(userRole?: string): boolean {
    if (this.appId === 'admin') return userRole === 'admin';
    if (this.appId === 'shell') return userRole === 'user' || userRole === 'admin';
    return userRole === 'user';
  }

  private getExpectedRoles(appId: AppId): string {
    if (appId === 'admin') return 'Admin';
    if (appId === 'shell') return 'User oder Admin';
    return 'User';
  }
}

