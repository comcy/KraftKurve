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
  templateUrl: './register.page.html',
  styleUrl: '../auth-page.scss',
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
