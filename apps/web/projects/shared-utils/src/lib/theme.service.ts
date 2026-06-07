import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AppTheme = 'tactical' | 'minimal-dark' | 'minimal-light';

const ALL_THEMES: AppTheme[] = ['tactical', 'minimal-dark', 'minimal-light'];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private readonly _platformId = inject(PLATFORM_ID);
  private _theme = signal<AppTheme>('tactical');

  constructor() {
    if (isPlatformBrowser(this._platformId)) {
      const saved = localStorage.getItem(this.THEME_KEY);
      // Backward compat: old 'dark' → 'tactical', old 'light' → 'minimal-light'
      const resolved: AppTheme | null =
        saved === 'dark' ? 'tactical' :
        saved === 'light' ? 'minimal-light' :
        (ALL_THEMES.includes(saved as AppTheme) ? saved as AppTheme : null);
      if (resolved) {
        this._theme.set(resolved);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        this._theme.set('minimal-light');
      }
    }

    effect(() => {
      const mode = this._theme();
      if (isPlatformBrowser(this._platformId)) {
        localStorage.setItem(this.THEME_KEY, mode);
        const root = document.documentElement;
        ALL_THEMES.forEach(t => root.classList.remove(`theme-${t}`));
        root.classList.add(`theme-${mode}`);
      }
    });
  }

  get theme() {
    return this._theme.asReadonly();
  }

  setTheme(theme: AppTheme): void {
    this._theme.set(theme);
  }
}
