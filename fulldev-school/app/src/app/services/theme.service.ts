import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'fulldev-school-theme';
  readonly isDark = signal<boolean>(this.readInitialTheme());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('fd-theme-dark', dark);
      localStorage.setItem(this.storageKey, dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update((value) => !value);
  }

  private readInitialTheme(): boolean {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      return stored === 'dark';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
