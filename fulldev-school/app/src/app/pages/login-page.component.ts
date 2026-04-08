import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <img class="login-logo" src="logo-completa-preta.png" alt="Fulldev School" />

        <h1>Entrar na plataforma</h1>
        <p class="login-subtitle">Acesse sua conta para continuar os estudos.</p>

        <div class="login-actions">
          <button
            mat-flat-button
            class="login-btn login-btn--google"
            type="button"
            [disabled]="loading()"
            (click)="signInWithGoogle()"
          >
            <mat-icon>login</mat-icon>
            Entrar com Google
          </button>
        </div>

        <div class="login-divider"><span>ou</span></div>

        <form class="login-form" (ngSubmit)="signInWithEmail()">
          <div class="login-field">
            <label for="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              autocomplete="email"
              placeholder="seu@email.com"
              [(ngModel)]="email"
              name="email"
              required
            />
          </div>

          <div class="login-field">
            <label for="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              autocomplete="current-password"
              placeholder="Sua senha"
              [(ngModel)]="password"
              name="password"
              required
            />
          </div>

          @if (errorMessage()) {
            <p class="login-error" role="alert">{{ errorMessage() }}</p>
          }

          <button
            mat-flat-button
            class="login-btn login-btn--primary"
            type="submit"
            [disabled]="loading()"
          >
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
        background: var(--fd-page-bg);
      }

      .login-card {
        display: grid;
        gap: 16px;
        width: 100%;
        max-width: 400px;
        padding: 36px;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .login-logo {
        height: 32px;
        object-fit: contain;
        object-position: left;
      }

      .login-card h1 {
        margin: 0;
        font-size: 1.4rem;
      }

      .login-subtitle {
        margin: 0;
        color: var(--fd-muted);
        font-size: 0.9rem;
      }

      .login-actions {
        display: grid;
        gap: 10px;
      }

      .login-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--fd-muted);
        font-size: 0.8rem;
      }

      .login-divider::before,
      .login-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--fd-border);
      }

      .login-form {
        display: grid;
        gap: 12px;
      }

      .login-field {
        display: grid;
        gap: 6px;
      }

      .login-field label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--fd-text);
      }

      .login-field input {
        height: 44px;
        padding: 0 12px;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
        color: var(--fd-text);
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.15s;
      }

      .login-field input:focus {
        border-color: var(--fd-accent);
      }

      .login-btn {
        min-height: 44px;
        width: 100%;
        border-radius: var(--fd-radius);
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .login-btn--google {
        border: 1px solid var(--fd-border) !important;
        background: var(--fd-surface-overlay) !important;
        color: var(--fd-text) !important;
        box-shadow: none !important;
      }

      .login-btn--google:hover {
        background: rgba(255, 255, 255, 0.05) !important;
      }

      .login-btn--primary {
        border: 1px solid var(--fd-accent) !important;
        background: var(--fd-accent) !important;
        color: var(--fd-white) !important;
        box-shadow: none !important;
      }

      .login-btn--primary:hover {
        background: var(--fd-accent-strong) !important;
        border-color: var(--fd-accent-strong) !important;
      }

      .login-error {
        margin: 0;
        padding: 10px 12px;
        border: 1px solid rgba(220, 60, 60, 0.4);
        background: rgba(220, 60, 60, 0.08);
        color: #f87171;
        font-size: 0.85rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected email = '';
  protected password = '';

  protected async signInWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    const result = await this.auth.signInWithGoogle();
    if (!result.ok) {
      this.errorMessage.set(result.message ?? 'Nao foi possivel entrar com Google.');
      this.loading.set(false);
    }
    // On success, Supabase redirects via OAuth — no manual navigation needed
  }

  protected async signInWithEmail(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    const result = await this.auth.signInWithEmail(this.email, this.password);

    if (!result.ok) {
      this.errorMessage.set(result.message ?? 'Nao foi possivel entrar.');
      this.loading.set(false);
      return;
    }

    void this.router.navigateByUrl('/courses/home');
  }
}
