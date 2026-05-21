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
  templateUrl: './login.page.html',
  styleUrl: '../auth-page.scss',
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
    if (this.appId === 'admin') {
      return userRole === 'admin';
    }
    if (this.appId === 'shell') {
      // Allow both in shell, but dashboard will show different content
      return userRole === 'user' || userRole === 'admin';
    }
    // training app: expect user
    return userRole === 'user';
  }

  private getExpectedRoles(appId: AppId): string {
    if (appId === 'admin') return 'Admin';
    if (appId === 'shell') return 'User oder Admin';
    return 'User';
  }
}

