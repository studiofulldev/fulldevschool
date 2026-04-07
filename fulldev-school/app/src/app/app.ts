import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, MatButtonModule],
  template: `
    <div class="app-root" [class.app-root--locked]="!auth.isAuthenticated()">
      <router-outlet />
    </div>

    @if (!auth.isAuthenticated()) {
      <div class="auth-gate">
        <div class="auth-gate__backdrop"></div>

        <section class="auth-gate__dialog" aria-modal="true" role="dialog" aria-labelledby="auth-gate-title">
          <span class="auth-gate__eyebrow">Fulldev School</span>
          <h1 id="auth-gate-title">Entre para continuar</h1>
          <p>
            O acesso a plataforma exige autenticacao. Use Google ou entre com seus dados para liberar
            toda a experiencia.
          </p>

          <div class="auth-gate__actions">
            <button mat-flat-button type="button" (click)="signInWithGoogle()">Entrar com Google</button>
          </div>

          <div class="auth-gate__divider">ou</div>

          <div class="auth-gate__form">
            <input [(ngModel)]="name" placeholder="Seu nome" />
            <input [(ngModel)]="email" placeholder="Seu e-mail" />
            <button mat-stroked-button type="button" (click)="signInWithEmail()">Entrar com e-mail</button>
          </div>
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
        width: min(100%, 460px);
        padding: 28px;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
        color: var(--fd-text);
      }

      .auth-gate__eyebrow,
      .auth-gate__divider {
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

      .auth-gate__form {
        display: grid;
        gap: 10px;
      }

      .auth-gate__form input {
        min-height: 44px;
        padding: 0 12px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.03);
        color: var(--fd-text);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly auth = inject(AuthService);
  protected name = '';
  protected email = '';

  protected signInWithGoogle(): void {
    this.auth.signInWithGoogle();
  }

  protected signInWithEmail(): void {
    this.auth.signInWithEmail(this.name, this.email);
  }
}
