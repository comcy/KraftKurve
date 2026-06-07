import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from 'lib-i18n';

@Component({
  selector: 'lib-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss',
})
export class AdminDashboardPage {
  protected readonly i18n = inject(I18nService);
}
