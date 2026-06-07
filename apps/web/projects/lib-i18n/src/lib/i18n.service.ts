import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { TranslationKey, Translations } from './translation-keys';

import nerdyTranslations from './locales/nerdy.json';
import deTranslations from './locales/de.json';
import enTranslations from './locales/en.json';

export type Language = 'nerdy' | 'de' | 'en';

const LOCALES: Record<Language, Translations> = {
  nerdy: nerdyTranslations as Translations,
  de: deTranslations as Translations,
  en: enTranslations as Translations,
};

const LANG_KEY = 'app-lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _lang = signal<Language>(this.loadSavedLang());

  // Recomputed on every lang change — templates that call t() re-render automatically.
  private readonly _map = computed<Translations>(() => LOCALES[this._lang()]);

  readonly lang = this._lang.asReadonly();

  constructor() {
    effect(() => {
      const lang = this._lang();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(LANG_KEY, lang);
      }
    });
  }

  setLang(lang: Language): void {
    this._lang.set(lang);
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const template = this._map()[key];
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  }

  private loadSavedLang(): Language {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(LANG_KEY) as Language | null;
      if (saved && saved in LOCALES) return saved;
    }
    return 'nerdy';
  }
}
