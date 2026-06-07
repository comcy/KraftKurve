import { Component, inject } from '@angular/core';
import { I18nService } from 'lib-i18n';

@Component({
  selector: 'lib-user-list',
  template: `<div style="padding:2rem"><h2>{{ i18n.t('admin.users.title') }}</h2><p>{{ i18n.t('admin.users.placeholder') }}</p></div>`,
})
export class UserListPage {
  protected readonly i18n = inject(I18nService);
}
