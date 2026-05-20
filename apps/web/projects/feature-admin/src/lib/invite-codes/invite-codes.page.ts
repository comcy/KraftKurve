import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'data-access-auth';

interface InviteCodeView {
  code: string;
  expiresAt: string | null;
  createdAt: string;
}

@Component({
  selector: 'lib-invite-codes-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="invite-page">
      <section class="invite-card">
        <h2>Invite-Codes</h2>
        <p class="copy">Admin darf nur User freischalten. Hier erzeugst du Invite-Codes.</p>

        <button class="btn-primary" (click)="createInvite()" [disabled]="creating()">
          {{ creating() ? 'Erzeuge…' : '+ Invite-Code erzeugen' }}
        </button>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        @if (!codes().length) {
          <p class="empty">Noch keine Codes erzeugt.</p>
        } @else {
          <ul class="code-list">
            @for (entry of codes(); track entry.code) {
              <li class="code-item">
                <div class="code-value">{{ entry.code }}</div>
                <div class="meta">gueltig bis: {{ entry.expiresAt ?? '-' }}</div>
                <button class="btn-secondary" (click)="copy(entry.code)">Kopieren</button>
              </li>
            }
          </ul>
        }
      </section>
    </main>
  `,
  styles: `
    .invite-page { padding: 1.2rem; max-width: 920px; margin: 0 auto; }
    .invite-card { background: #fffefb; border: 1px solid #dfd8c4; border-radius: 12px; padding: 1rem; }
    .copy { margin: 0.2rem 0 1rem; color: #666; }
    .btn-primary { border: 1px solid #bca77a; background: #2b1c00; color: #fff; border-radius: 8px; padding: 0.5rem 0.85rem; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { border: 1px solid #d1d5db; background: #fff; color: #222; border-radius: 8px; padding: 0.35rem 0.65rem; cursor: pointer; }
    .code-list { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: 0.6rem; }
    .code-item { border: 1px solid #ebe6d6; border-radius: 10px; padding: 0.75rem; display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .code-value { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; font-size: 0.9rem; background: #f7f4eb; border: 1px dashed #d8cda9; padding: 0.35rem 0.5rem; border-radius: 6px; }
    .meta { color: #666; font-size: 0.84rem; }
    .empty { margin-top: 0.9rem; color: #777; }
    .error { margin-top: 0.7rem; color: #b42318; }
  `,
})
export class InviteCodesPage {
  private readonly authService = inject(AuthService);

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
