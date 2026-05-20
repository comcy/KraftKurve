import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'lib-admin-dashboard',
  imports: [RouterLink],
  template: `
    <main style="padding:1.2rem;max-width:920px;margin:0 auto;display:grid;gap:0.8rem">
      <h2 style="margin:0">Admin</h2>
      <p style="margin:0;color:#666">Admin-Fokus: Invite-Codes fuer User-Freischaltung.</p>
      <nav style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <a routerLink="invites" style="padding:0.45rem 0.65rem;border:1px solid #d4cbaa;border-radius:0.55rem;text-decoration:none;color:#2b2b2b">Invite-Codes</a>
        <a routerLink="users" style="padding:0.45rem 0.65rem;border:1px solid #d4cbaa;border-radius:0.55rem;text-decoration:none;color:#2b2b2b">Nutzerverwaltung</a>
        <a routerLink="exercises" style="padding:0.45rem 0.65rem;border:1px solid #d4cbaa;border-radius:0.55rem;text-decoration:none;color:#2b2b2b">Übungskatalog</a>
      </nav>
    </main>
  `,
})
export class AdminDashboardPage {}
