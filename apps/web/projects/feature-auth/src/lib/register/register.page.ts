import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, FormRoot, email, form, minLength, required } from '@angular/forms/signals';
import { AuthService } from 'data-access-auth';
import { AUTH_PAGE_STYLES } from '../auth-page.styles';
import { getErrorMessage } from '../auth-error.util';
import { trackError } from '../auth-form.helpers';

interface RegisterModel {
  inviteCode: string;
  displayName: string;
  email: string;
  password: string;
}

@Component({
  selector: 'lib-register',
  imports: [FormField, FormRoot, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <p class="auth-eyebrow">Admin invite only</p>
        <h1 class="auth-title">Registrieren</h1>
        <p class="auth-copy">Nur mit gültigem Invite-Code. Danach ist der Zugang direkt aktiv.</p>

        <form class="auth-form" [formRoot]="registerForm">
          @if (registerForm().errors().length) {
            <div class="auth-banner" aria-live="polite">
              @for (error of registerForm().errors(); track trackError($index, error)) {
                <p class="auth-error">{{ error.message }}</p>
              }
            </div>
          }

          <label class="auth-field">
            <span class="auth-label">Invite-Code</span>
            <input class="auth-input" type="text" [formField]="registerForm.inviteCode" />
            @if (registerForm.inviteCode().touched() && registerForm.inviteCode().errors().length) {
              @for (error of registerForm.inviteCode().errors(); track trackError($index, error)) {
                <p class="auth-error">{{ error.message }}</p>
              }
            }
          </label>

          <label class="auth-field">
            <span class="auth-label">Anzeigename</span>
            <input class="auth-input" type="text" [formField]="registerForm.displayName" />
            @if (registerForm.displayName().touched() && registerForm.displayName().errors().length) {
              @for (error of registerForm.displayName().errors(); track trackError($index, error)) {
                <p class="auth-error">{{ error.message }}</p>
              }
            }
          </label>

          <label class="auth-field">
            <span class="auth-label">E-Mail</span>
            <input class="auth-input" type="email" [formField]="registerForm.email" />
            @if (registerForm.email().touched() && registerForm.email().errors().length) {
              @for (error of registerForm.email().errors(); track trackError($index, error)) {
                <p class="auth-error">{{ error.message }}</p>
              }
            }
          </label>

          <label class="auth-field">
            <span class="auth-label">Passwort</span>
            <input class="auth-input" type="password" [formField]="registerForm.password" />
            @if (registerForm.password().touched() && registerForm.password().errors().length) {
              @for (error of registerForm.password().errors(); track trackError($index, error)) {
                <p class="auth-error">{{ error.message }}</p>
              }
            }
          </label>

          <button class="auth-submit" type="submit" [disabled]="registerForm().submitting()">
            @if (registerForm().submitting()) {
              Registrierung...
            } @else {
              Account anlegen
            }
          </button>
        </form>

        <p class="auth-footer">
          Bereits registriert? <a class="auth-link" routerLink="/auth/login">Zum Login</a>
        </p>
      </div>
    </section>
  `,
  styles: [AUTH_PAGE_STYLES],
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly trackError = trackError;
  protected readonly registerModel = signal<RegisterModel>({
    inviteCode: '',
    displayName: '',
    email: '',
    password: '',
  });

  protected readonly registerForm = form(
    this.registerModel,
    (register) => {
      required(register.inviteCode, { message: 'Invite-Code ist erforderlich.' });
      minLength(register.inviteCode, 8, { message: 'Invite-Code zu kurz.' });
      required(register.displayName, { message: 'Anzeigename ist erforderlich.' });
      minLength(register.displayName, 2, { message: 'Mindestens 2 Zeichen.' });
      required(register.email, { message: 'E-Mail ist erforderlich.' });
      email(register.email, { message: 'Bitte eine gültige E-Mail eingeben.' });
      required(register.password, { message: 'Passwort ist erforderlich.' });
      minLength(register.password, 8, { message: 'Mindestens 8 Zeichen.' });
    },
    {
      submission: {
        action: async (field) => {
          try {
            await this.authService.register(field().value());
            await this.router.navigateByUrl('/');
            return;
          } catch (error) {
            const message = getErrorMessage(error);
            if (message.includes('Email already registered')) {
              return { kind: 'serverError', message, fieldTree: field.email };
            }
            if (message.includes('Invite')) {
              return { kind: 'serverError', message, fieldTree: field.inviteCode };
            }
            return { kind: 'serverError', message };
          }
        },
      },
    },
  );
}
