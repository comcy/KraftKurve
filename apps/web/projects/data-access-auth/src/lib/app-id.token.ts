import { InjectionToken } from '@angular/core';

export type AppId = 'shell' | 'admin' | 'training';
export const APP_ID = new InjectionToken<AppId>('appId');
