import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'lib-auth-data-access';
import { I18nService } from 'lib-i18n';

interface InviteCodeView {
  code: string;
  expiresAt: string | null;
  createdAt: string;
}

@Component({
  selector: 'lib-invite-codes-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invite-codes.page.html',
  styleUrl: './invite-codes.page.scss',
})
export class InviteCodesPage {
  private readonly authService = inject(AuthService);
  protected readonly i18n = inject(I18nService);

  protected readonly creating = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly codes = signal<InviteCodeView[]>([]);

  protected async createInvite(): Promise<void> {
    this.creating.set(true);
    this.error.set(null);
    try {
      const invite = await this.authService.createInvite();
      this.codes.update((list) => [
        {
          code: invite.code,
          expiresAt: invite.expiresAt,
          createdAt: new Date().toISOString(),
        },
        ...list,
      ]);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invite konnte nicht erstellt werden.');
    } finally {
      this.creating.set(false);
    }
  }

  protected async copy(code: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // noop
    }
  }
}
