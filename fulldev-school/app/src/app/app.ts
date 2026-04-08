import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatButtonModule],
  template: `
    <div class="app-root" [class.app-root--locked]="isGateEnabled()">
      <router-outlet />
    </div>

    @if (isGateEnabled()) {
      <div class="auth-gate">
        <div class="auth-gate__backdrop"></div>

        <section class="auth-gate__dialog" aria-modal="true" role="dialog" aria-labelledby="auth-gate-title">
          <div class="auth-gate__header">
            <span class="auth-gate__eyebrow">Fulldev School</span>
            <img class="auth-gate__brand" src="logo-fulldev.svg" alt="Fulldev School" />
          </div>

          <h1 id="auth-gate-title">Entre para continuar</h1>
          <p>Escolha um provedor para acessar a plataforma no mesmo padrao visual da area de cursos.</p>

          <div class="auth-gate__actions">
            <button
              mat-stroked-button
              class="auth-provider-button auth-provider-button--secondary"
              type="button"
              (click)="signInWithGoogle()"
              [disabled]="!supabase.isConfigured"
            >
              <span class="auth-provider-button__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path
                    fill="currentColor"
                    d="M21.81 10.04h-9.77v3.92h5.6c-.24 1.26-.96 2.33-2.04 3.04v2.52h3.3c1.93-1.78 3.05-4.4 3.05-7.52 0-.67-.06-1.31-.14-1.96Z"
                  />
                  <path
                    fill="currentColor"
                    d="M12.04 22c2.76 0 5.08-.91 6.77-2.48l-3.3-2.52c-.91.61-2.08.98-3.47.98-2.67 0-4.93-1.8-5.74-4.23H2.89v2.6A10.22 10.22 0 0 0 12.04 22Z"
                  />
                  <path
                    fill="currentColor"
                    d="M6.3 13.75a6.13 6.13 0 0 1 0-3.5v-2.6H2.89a10.08 10.08 0 0 0 0 8.7l3.41-2.6Z"
                  />
                  <path
                    fill="currentColor"
                    d="M12.04 6.02c1.5 0 2.84.52 3.9 1.54l2.91-2.91C17.12 2.96 14.8 2 12.04 2a10.22 10.22 0 0 0-9.15 5.65l3.41 2.6c.81-2.43 3.07-4.23 5.74-4.23Z"
                  />
                </svg>
              </span>
              <span class="auth-provider-button__label">Entrar com Google</span>
            </button>

            <button
              mat-flat-button
              class="auth-provider-button auth-provider-button--primary"
              type="button"
              (click)="signInWithLinkedIn()"
              [disabled]="!supabase.isConfigured"
            >
              <span class="auth-provider-button__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path
                    fill="currentColor"
                    d="M20.45 20.45h-3.56v-5.58c0-1.33-.03-3.03-1.84-3.03-1.84 0-2.12 1.44-2.12 2.94v5.67H9.37V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.35 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.13 20.45H3.57V9h3.56v11.45Z"
                  />
                </svg>
              </span>
              <span class="auth-provider-button__label">Entrar com LinkedIn</span>
            </button>
          </div>

          <div class="auth-gate__legal">
            <a routerLink="/legal/privacy">Politica de Privacidade</a>
            <a routerLink="/legal/terms">Termos de Uso</a>
          </div>

          @if (!supabase.isConfigured && supabase.configError) {
            <p class="auth-gate__warning">{{ supabase.configError }}</p>
          }

          <!--
          Fluxos de e-mail e criacao de conta foram desativados temporariamente.
          Manter este bloco comentado ate a autenticacao por e-mail voltar para a UI.
          -->

          @if (errorMessage()) {
            <p class="auth-gate__error">{{ errorMessage() }}</p>
          }
        </section>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      .app-root {
        min-height: 100vh;
      }

      .app-root--locked {
        pointer-events: none;
        user-select: none;
        filter: blur(10px);
      }

      .auth-gate {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .auth-gate__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(6, 6, 6, 0.36);
        backdrop-filter: blur(14px);
      }

      .auth-gate__dialog {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 16px;
        width: min(100%, 520px);
        max-height: min(92vh, 920px);
        padding: 28px;
        overflow: auto;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
        color: var(--fd-text);
      }

      .auth-gate__header {
        display: grid;
        gap: 14px;
        justify-items: center;
        text-align: center;
      }

      .auth-gate__brand {
        width: min(100%, 84px);
        height: auto;
        object-fit: contain;
      }

      .auth-gate__eyebrow {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .auth-gate__dialog h1,
      .auth-gate__dialog p {
        margin: 0;
      }

      .auth-gate__dialog p {
        color: var(--fd-muted);
      }

      .auth-gate__actions,
      .auth-gate__form {
        display: grid;
        gap: 14px;
      }

      .auth-provider-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        min-height: 52px;
        padding-inline: 18px;
        border-radius: var(--fd-radius);
        font-weight: 600;
        box-shadow: none !important;
      }

      .auth-provider-button__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        flex: 0 0 18px;
      }

      .auth-provider-button__icon svg {
        width: 18px;
        height: 18px;
      }

      .auth-provider-button__label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        text-align: center;
      }

      .auth-provider-button--primary {
        border: 1px solid var(--fd-accent) !important;
        color: var(--fd-white) !important;
        background: var(--fd-accent) !important;
      }

      .auth-provider-button--primary:hover {
        border-color: var(--fd-accent-strong) !important;
        background: var(--fd-accent-strong) !important;
      }

      .auth-provider-button--secondary {
        border: 1px solid var(--fd-border) !important;
        color: var(--fd-text) !important;
        background: var(--fd-surface-overlay) !important;
      }

      .auth-provider-button--secondary:hover {
        border-color: var(--fd-border-strong) !important;
        background: var(--fd-nav-active) !important;
      }

      .auth-gate__error {
        color: #ff9e7a !important;
      }

      .auth-gate__warning {
        color: #ffd2c3 !important;
        font-size: 0.92rem;
        line-height: 1.6;
      }

      .auth-gate__legal {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .auth-gate__legal a {
        color: var(--fd-soft);
        text-decoration: none;
      }

      .auth-gate__legal a:hover {
        color: var(--fd-text);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  protected readonly errorMessage = signal('');
  private readonly currentUrl = signal(this.router.url);
  protected readonly isGateEnabled = computed(
    () => !this.auth.isAuthenticated() && !this.currentUrl().startsWith('/legal/')
  );

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.currentUrl.set((event as NavigationEnd).urlAfterRedirects);
    });
  }

  protected async signInWithGoogle(): Promise<void> {
    this.errorMessage.set('');
    const result = await this.auth.signInWithGoogle();
    this.errorMessage.set(result.ok ? '' : (result.message ?? 'Nao foi possivel entrar com Google.'));
  }

  protected async signInWithLinkedIn(): Promise<void> {
    this.errorMessage.set('');
    const result = await this.auth.signInWithLinkedIn();
    this.errorMessage.set(result.ok ? '' : (result.message ?? 'Nao foi possivel entrar com LinkedIn.'));
  }
}
