import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { App } from './app';

@Component({
  selector: 'app-admin-shell-wrapper',
  standalone: true,
  imports: [App],
  template: `<app-admin-root [hideLayout]="true" />`
})
export class AdminShellWrapperComponent {}
