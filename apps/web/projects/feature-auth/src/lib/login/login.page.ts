import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, FormRoot, email, form, minLength, required } from '@angular/forms/signals';
import { AuthService, APP_ID, AppId } from 'data-access-auth';
import { AUTH_PAGE_STYLES } from '../auth-page.styles';
import { getErrorMessage } from '../auth-error.util';
import { trackError } from '../auth-form.helpers';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'lib-login',
  imports: [FormField, FormRoot, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <p class="auth-eyebrow">KraftKurve</p>
        <h1 class="auth-title">Willkommen zurück</h1>
        <p class="auth-copy">Login für Shell, Training und Admin.</p>

        <form class="auth-form" [formRoot]="loginForm">
          @if (loginForm().errors().length) {
            <div class="auth-banner" aria-live="polite">
              @for (error of loginForm().errors(); track trackError($index, error)) {
                <p class="auth-error">{{ error.message }}</p>
              }
            </div>
          }

          <label class="auth-field">
            <span class="auth-label">E-Mail</span>
            <input class="auth-input" type="email" [formField]="loginForm.email" />
            @if (loginForm.email().touched() && loginForm.email().errors().length) {
              @for (error of loginForm.email().errors(); track trackError($index, error)) {
                <p class="auth-error">{{ error.message }}</p>
              }
            }
          </label>

          <label class="auth-field">
            <span class="auth-label">Passwort</span>
            <input class="auth-input" type="password" [formField]="loginForm.password" />
            @if (loginForm.password().touched() && loginForm.password().errors().length) {
              @for (error of loginForm.password().errors(); track trackError($index, error)) {
                <p class="auth-error">{{ error.message }}</p>
              }
            }
          </label>

          <button class="auth-submit" type="submit" [disabled]="loginForm().submitting()">
            @if (loginForm().submitting()) {
              Anmeldung...
            } @else {
              Einloggen
            }
          </button>
        </form>

        <p class="auth-footer">
          Noch kein Zugang? <a class="auth-link" routerLink="/auth/register">Mit Invite registrieren</a>
        </p>
      </div>
    </section>
  `,
  styles: [AUTH_PAGE_STYLES],
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly appId = inject(APP_ID);

  protected readonly trackError = trackError;
  protected readonly loginModel = signal<LoginModel>({
    email: '',
    password: '',
  });

  protected readonly loginForm = form(
    this.loginModel,
    (login) => {
      required(login.email, { message: 'E-Mail ist erforderlich.' });
      email(login.email, { message: 'Bitte eine gültige E-Mail eingeben.' });
      required(login.password, { message: 'Passwort ist erforderlich.' });
      minLength(login.password, 8, { message: 'Mindestens 8 Zeichen.' });
    },
    {
      submission: {
        action: async (field) => {
          try {
            await this.authService.login(field().value());
            const user = this.authService.getCurrentUser();
            
            // Validate role matches app
            if (!this.isValidRole(user?.role)) {
              const expectedRoles = this.getExpectedRoles(this.appId);
              return {
                kind: 'serverError',
                message: `Diese App ist für ${expectedRoles} reserviert.`,
              };
            }
            
            await this.router.navigateByUrl('/');
            return;
          } catch (error) {
            return { kind: 'serverError', message: getErrorMessage(error) };
          }
        },
      },
    },
  );

  private isValidRole(userRole?: string): boolean {
    const expectedRoles = this.getExpectedRoles(this.appId);
    if (this.appId === 'admin') {
      return userRole === 'admin';
    }
    // shell, training: expect user
    return userRole === 'user';
  }

  private getExpectedRoles(appId: AppId): string {
    return appId === 'admin' ? 'Admin' : 'User';
  }
}

