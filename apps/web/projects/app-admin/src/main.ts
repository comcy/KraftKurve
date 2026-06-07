import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { Component } from '@angular/core';
import { App } from './app/app';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [App],
  template: `<app-admin-root [hideLayout]="false" />`
})
class RootComponent {}

bootstrapApplication(RootComponent, appConfig)
  .catch((err) => console.error(err));
