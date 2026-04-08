import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatButtonModule],
  template: `
    <div class="app-root" [class.app-root--locked]="!auth.isAuthenticated()">
      <router-outlet />
    </div>

    @if (!auth.isAuthenticated()) {
      <div class="auth-gate">
        <div class="auth-gate__backdrop"></div>

        <section class="auth-gate__dialog" aria-modal="true" role="dialog" aria-labelledby="auth-gate-title">
          <div class="auth-gate__header">
            <span class="auth-gate__eyebrow">Fulldev School</span>
          </div>

          <h1 id="auth-gate-title">Entre para continuar</h1>
          <p>Use Google para liberar toda a experiencia da plataforma.</p>

          <div class="auth-gate__actions">
            <button mat-flat-button type="button" (click)="signInWithGoogle()">Entrar com Google</button>
          </div>

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
        gap: 10px;
      }

      .auth-gate__error {
        color: #ff9e7a !important;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly errorMessage = signal('');

  protected async signInWithGoogle(): Promise<void> {
    this.errorMessage.set('');
    const result = await this.auth.signInWithGoogle();
    this.errorMessage.set(result.ok ? '' : (result.message ?? 'Nao foi possivel entrar com Google.'));
  }
}
