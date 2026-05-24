import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _theme = signal<ThemeMode>('dark');

  constructor() {
    if (isPlatformBrowser(this._platformId)) {
      const savedTheme = localStorage.getItem('app-theme') as ThemeMode;
      if (savedTheme) {
        this._theme.set(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        this._theme.set('light');
      }
    }

    effect(() => {
      const mode = this._theme();
      if (isPlatformBrowser(this._platformId)) {
        localStorage.setItem('app-theme', mode);
        const root = document.documentElement;
        if (mode === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      }
    });
  }

  get theme() {
    return this._theme.asReadonly();
  }

  toggleTheme() {
    this._theme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode) {
    this._theme.set(mode);
  }
}
