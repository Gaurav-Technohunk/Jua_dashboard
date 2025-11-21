import { DOCUMENT } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'jua-dashboard-theme';
  private readonly renderer: Renderer2;
  private mediaQuery?: MediaQueryList;
  private themeSubject = new BehaviorSubject<ThemeMode>('light');
  private readonly isBrowser = typeof window !== 'undefined';

  readonly themeChanges$ = this.themeSubject.asObservable();

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    if (this.isBrowser && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', (event) => {
        if (!this.getStoredTheme()) {
          this.applyTheme(event.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  init(): void {
    const storedTheme = this.getStoredTheme();
    const prefersDark = this.mediaQuery?.matches;
    const initialTheme: ThemeMode = storedTheme ?? (prefersDark ? 'dark' : 'light');
    this.applyTheme(initialTheme, false);
  }

  get currentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  toggleTheme(): void {
    this.applyTheme(this.currentTheme === 'light' ? 'dark' : 'light');
  }

  setTheme(mode: ThemeMode): void {
    this.applyTheme(mode);
  }

  private getStoredTheme(): ThemeMode | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
      return null;
    }
  }

  private applyTheme(mode: ThemeMode, persist: boolean = true): void {
    if (this.themeSubject.value === mode) {
      this.renderer.setAttribute(this.document.documentElement, 'data-theme', mode);
      return;
    }

    this.themeSubject.next(mode);
    this.renderer.setAttribute(this.document.documentElement, 'data-theme', mode);

    if (persist && this.isBrowser) {
      try {
        localStorage.setItem(this.storageKey, mode);
      } catch {
        // Ignore storage failures (e.g., Safari private mode)
      }
    }
  }
}

