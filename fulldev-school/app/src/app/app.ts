import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, TechnicalLevel } from './services/auth.service';

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
          <div class="auth-gate__header">
            <span class="auth-gate__eyebrow">Fulldev School</span>
            <div class="auth-gate__switch">
              <button
                type="button"
                class="auth-gate__mode"
                [class.is-active]="mode() === 'login'"
                (click)="setMode('login')"
              >
                Entrar
              </button>
              <button
                type="button"
                class="auth-gate__mode"
                [class.is-active]="mode() === 'signup'"
                (click)="setMode('signup')"
              >
                Criar conta
              </button>
            </div>
          </div>

          @if (mode() === 'login') {
            <h1 id="auth-gate-title">Entre para continuar</h1>
            <p>Use Google ou os dados da sua conta para liberar toda a experiencia da plataforma.</p>

            <div class="auth-gate__actions">
              <button mat-flat-button type="button" (click)="signInWithGoogle()">Entrar com Google</button>
            </div>

            <div class="auth-gate__divider">ou</div>

            <div class="auth-gate__form">
              <input [(ngModel)]="loginEmail" placeholder="Seu e-mail" />
              <input [(ngModel)]="loginPassword" type="password" placeholder="Sua senha" />
              <button mat-stroked-button type="button" (click)="signInWithEmail()">Entrar com e-mail</button>
            </div>
          } @else {
            <h1 id="auth-gate-title">Crie sua conta</h1>
            <p>
              Cadastre seu perfil para acessar os cursos da FullDev School e receber comunicacoes da
              plataforma.
            </p>

            <div class="auth-gate__actions">
              <button mat-flat-button type="button" (click)="signInWithGoogle()">Continuar com Google</button>
            </div>

            <div class="auth-gate__divider">ou cadastre com e-mail</div>

            <div class="auth-gate__form auth-gate__form--signup">
              <input [(ngModel)]="signupName" placeholder="Nome completo" />
              <input [(ngModel)]="signupEmail" placeholder="E-mail" />
              <input [(ngModel)]="signupPassword" type="password" placeholder="Senha" />
              <input [(ngModel)]="signupWhatsapp" placeholder="WhatsApp (opcional)" />
              <input [(ngModel)]="signupAge" type="number" min="0" placeholder="Idade" />

              <select [(ngModel)]="signupTechnicalLevel">
                @for (level of technicalLevels; track level.value) {
                  <option [ngValue]="level.value">{{ level.label }}</option>
                }
              </select>

              <input [(ngModel)]="signupInstitution" placeholder="Instituicao de ensino (opcional)" />

              <label class="auth-gate__checkbox">
                <input [(ngModel)]="signupAcceptedTerms" type="checkbox" />
                <span>
                  Aceito os termos e autorizo a FullDev a salvar meu nome e e-mail para disparo de
                  comunicacoes, convites e atualizacoes.
                </span>
              </label>

              <button mat-stroked-button type="button" (click)="registerWithEmail()">Criar conta</button>
            </div>
          }

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

      .auth-gate__eyebrow,
      .auth-gate__divider {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .auth-gate__switch {
        display: inline-grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.03);
      }

      .auth-gate__mode {
        min-height: 42px;
        border: 0;
        background: transparent;
        color: var(--fd-muted);
        cursor: pointer;
      }

      .auth-gate__mode.is-active {
        background: var(--fd-surface-header);
        color: var(--fd-text);
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

      .auth-gate__form input,
      .auth-gate__form select {
        min-height: 44px;
        padding: 0 12px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.03);
        color: var(--fd-text);
      }

      .auth-gate__form--signup {
        gap: 12px;
      }

      .auth-gate__checkbox {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        align-items: start;
        color: var(--fd-muted);
        font-size: var(--fd-text-sm);
      }

      .auth-gate__checkbox input {
        min-height: 16px;
        margin-top: 2px;
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
  protected readonly mode = signal<'login' | 'signup'>('signup');
  protected readonly errorMessage = signal('');
  protected readonly technicalLevels: Array<{ value: TechnicalLevel; label: string }> = [
    { value: 'iniciante', label: 'Iniciante' },
    { value: 'intermediario', label: 'Intermediario' },
    { value: 'avancado', label: 'Avancado' }
  ];

  protected loginEmail = '';
  protected loginPassword = '';

  protected signupName = '';
  protected signupEmail = '';
  protected signupPassword = '';
  protected signupWhatsapp = '';
  protected signupAge: number | null = null;
  protected signupTechnicalLevel: TechnicalLevel = 'iniciante';
  protected signupInstitution = '';
  protected signupAcceptedTerms = false;

  protected setMode(mode: 'login' | 'signup'): void {
    this.mode.set(mode);
    this.errorMessage.set('');
  }

  protected async signInWithGoogle(): Promise<void> {
    this.errorMessage.set('');
    const result = await this.auth.signInWithGoogle();
    this.errorMessage.set(result.ok ? '' : (result.message ?? 'Nao foi possivel entrar com Google.'));
  }

  protected async signInWithEmail(): Promise<void> {
    const result = await this.auth.signInWithEmail(this.loginEmail, this.loginPassword);
    this.errorMessage.set(result.ok ? '' : (result.message ?? 'Nao foi possivel entrar.'));
  }

  protected async registerWithEmail(): Promise<void> {
    const result = await this.auth.registerWithEmail({
      name: this.signupName,
      email: this.signupEmail,
      password: this.signupPassword,
      whatsappNumber: this.signupWhatsapp,
      age: this.signupAge,
      technicalLevel: this.signupTechnicalLevel,
      educationInstitution: this.signupInstitution,
      acceptedTerms: this.signupAcceptedTerms
    });

    this.errorMessage.set(result.ok ? (result.message ?? '') : (result.message ?? 'Nao foi possivel criar a conta.'));
  }
}
