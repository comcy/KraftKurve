import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private readonly _platformId = inject(PLATFORM_ID);
  private _theme = signal<'dark' | 'light'>('dark');

  constructor() {
    if (isPlatformBrowser(this._platformId)) {
      const saved = localStorage.getItem(this.THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        this._theme.set(saved);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        this._theme.set('light');
      }
    }

    effect(() => {
      const mode = this._theme();
      if (isPlatformBrowser(this._platformId)) {
        localStorage.setItem(this.THEME_KEY, mode);
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

  toggleTheme(): void {
    this._theme.update(t => t === 'dark' ? 'light' : 'dark');
  }
}
