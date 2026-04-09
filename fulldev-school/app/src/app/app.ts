import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { filter } from 'rxjs';
import { AuthService, TechnicalLevel } from './services/auth.service';
import { SupabaseService } from './services/supabase.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, MatButtonModule],
  template: `
    <div class="app-root" [class.app-root--locked]="isGateEnabled() || isProfileCompletionOpen()">
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

          <h1 id="auth-gate-title">{{ authMode() === 'login' ? 'Entre para continuar' : 'Crie sua conta' }}</h1>
          <p>
            @if (authMode() === 'login') {
              Escolha um provedor ou entre com e-mail e senha para acessar a plataforma.
            } @else {
              Preencha seu cadastro completo ou use Google e LinkedIn para iniciar o acesso.
            }
          </p>

          <div class="auth-mode-switch" role="tablist" aria-label="Modo de autenticacao">
            <button
              type="button"
              class="auth-mode-switch__button"
              [class.auth-mode-switch__button--active]="authMode() === 'login'"
              (click)="setAuthMode('login')"
            >
              Entrar
            </button>
            <button
              type="button"
              class="auth-mode-switch__button"
              [class.auth-mode-switch__button--active]="authMode() === 'register'"
              (click)="setAuthMode('register')"
            >
              Cadastrar
            </button>
          </div>

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
              <span class="auth-provider-button__label">
                {{ authMode() === 'login' ? 'Entrar com Google' : 'Continuar com Google' }}
              </span>
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
              <span class="auth-provider-button__label">
                {{ authMode() === 'login' ? 'Entrar com LinkedIn' : 'Continuar com LinkedIn' }}
              </span>
            </button>
          </div>

          <div class="auth-gate__divider">
            <span></span>
            <strong>ou</strong>
            <span></span>
          </div>

          @if (authMode() === 'login') {
            <form class="auth-profile-form" (ngSubmit)="submitEmailLogin()">
              <div class="auth-profile-grid auth-profile-grid--single">
                <label class="auth-field" for="login-email">
                  <span>E-mail</span>
                  <input
                    id="login-email"
                    name="login-email"
                    type="email"
                    [ngModel]="loginEmail()"
                    (ngModelChange)="loginEmail.set($event)"
                    autocomplete="email"
                    required
                  />
                </label>

                <label class="auth-field" for="login-password">
                  <span>Senha</span>
                  <input
                    id="login-password"
                    name="login-password"
                    type="password"
                    [ngModel]="loginPassword()"
                    (ngModelChange)="loginPassword.set($event)"
                    autocomplete="current-password"
                    required
                  />
                </label>
              </div>

              <div class="auth-gate__actions">
                <button
                  mat-flat-button
                  class="auth-provider-button auth-provider-button--primary"
                  type="submit"
                  [disabled]="authSubmitting()"
                >
                  {{ authSubmitting() ? 'Entrando...' : 'Entrar com e-mail e senha' }}
                </button>
              </div>
            </form>
          } @else {
            <form class="auth-profile-form" (ngSubmit)="submitEmailRegistration()">
              <div class="auth-profile-grid">
                <label class="auth-field" for="register-name">
                  <span>Nome completo</span>
                  <input
                    id="register-name"
                    name="register-name"
                    type="text"
                    [ngModel]="registerName()"
                    (ngModelChange)="registerName.set($event)"
                    autocomplete="name"
                    required
                  />
                </label>

                <label class="auth-field" for="register-email">
                  <span>E-mail</span>
                  <input
                    id="register-email"
                    name="register-email"
                    type="email"
                    [ngModel]="registerEmail()"
                    (ngModelChange)="registerEmail.set($event)"
                    autocomplete="email"
                    required
                  />
                </label>

                <label class="auth-field" for="register-password">
                  <span>Senha</span>
                  <input
                    id="register-password"
                    name="register-password"
                    type="password"
                    [ngModel]="registerPassword()"
                    (ngModelChange)="registerPassword.set($event)"
                    autocomplete="new-password"
                    required
                  />
                </label>

                <label class="auth-field" for="register-whatsapp">
                  <span>WhatsApp</span>
                  <input
                    id="register-whatsapp"
                    name="register-whatsapp"
                    type="tel"
                    [ngModel]="registerWhatsapp()"
                    (ngModelChange)="registerWhatsapp.set($event)"
                    autocomplete="tel"
                  />
                </label>

                <label class="auth-field" for="register-age">
                  <span>Idade</span>
                  <input
                    id="register-age"
                    name="register-age"
                    type="number"
                    min="1"
                    [ngModel]="registerAge()"
                    (ngModelChange)="onRegisterAgeChange($event)"
                    required
                  />
                </label>

                <label class="auth-field" for="register-level">
                  <span>Nivel tecnico</span>
                  <select
                    id="register-level"
                    name="register-level"
                    [ngModel]="registerTechnicalLevel()"
                    (ngModelChange)="registerTechnicalLevel.set($event)"
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediario</option>
                    <option value="avancado">Avancado</option>
                  </select>
                </label>

                <label class="auth-field auth-field--full" for="register-education">
                  <span>Instituicao de ensino</span>
                  <input
                    id="register-education"
                    name="register-education"
                    type="text"
                    [ngModel]="registerEducationInstitution()"
                    (ngModelChange)="registerEducationInstitution.set($event)"
                    autocomplete="organization"
                  />
                </label>
              </div>

              <label class="auth-check" for="register-terms">
                <input
                  id="register-terms"
                  name="register-terms"
                  type="checkbox"
                  [ngModel]="registerAcceptedTerms()"
                  (ngModelChange)="registerAcceptedTerms.set(!!$event)"
                />
                <span>Li e aceito a Politica de Privacidade e os Termos de Uso.</span>
              </label>

              <div class="auth-gate__actions">
                <button
                  mat-flat-button
                  class="auth-provider-button auth-provider-button--primary"
                  type="submit"
                  [disabled]="authSubmitting()"
                >
                  {{ authSubmitting() ? 'Cadastrando...' : 'Cadastrar com e-mail e senha' }}
                </button>
              </div>
            </form>
          }

          <div class="auth-gate__legal">
            <a routerLink="/legal/privacy">Politica de Privacidade</a>
            <a routerLink="/legal/terms">Termos de Uso</a>
          </div>

          @if (!supabase.isConfigured && supabase.configError) {
            <p class="auth-gate__warning">{{ supabase.configError }}</p>
          }

          @if (errorMessage()) {
            <p class="auth-gate__error">{{ errorMessage() }}</p>
          }
        </section>
      </div>
    }

    @if (isProfileCompletionOpen()) {
      <div class="auth-gate">
        <div class="auth-gate__backdrop"></div>

        <section class="auth-gate__dialog auth-gate__dialog--profile" aria-modal="true" role="dialog" aria-labelledby="profile-gate-title">
          <div class="auth-gate__header">
            <span class="auth-gate__eyebrow">Complete seu cadastro</span>
            <img class="auth-gate__brand" src="logo-fulldev.svg" alt="Fulldev School" />
          </div>

          <h2 id="profile-gate-title">Faltam alguns dados para liberar sua conta.</h2>
          <p>
            Seu acesso com Google ou LinkedIn ja foi validado. Agora complete as informacoes restantes
            para atualizar o cadastro no banco e finalizar a liberacao da plataforma.
          </p>

          <form class="auth-profile-form" (ngSubmit)="submitProfileCompletion()">
            <div class="auth-profile-grid">
              <label class="auth-field" for="oauth-name">
                <span>Nome completo</span>
                <input
                  id="oauth-name"
                  name="oauth-name"
                  type="text"
                  [ngModel]="profileName()"
                  (ngModelChange)="profileName.set($event)"
                  autocomplete="name"
                  required
                />
              </label>

              <label class="auth-field" for="oauth-email">
                <span>E-mail</span>
                <input
                  id="oauth-email"
                  name="oauth-email"
                  type="email"
                  [ngModel]="auth.user()?.email ?? ''"
                  autocomplete="email"
                  disabled
                />
              </label>

              <label class="auth-field" for="oauth-whatsapp">
                <span>WhatsApp</span>
                <input
                  id="oauth-whatsapp"
                  name="oauth-whatsapp"
                  type="tel"
                  [ngModel]="profileWhatsapp()"
                  (ngModelChange)="profileWhatsapp.set($event)"
                  autocomplete="tel"
                />
              </label>

              <label class="auth-field" for="oauth-age">
                <span>Idade</span>
                <input
                  id="oauth-age"
                  name="oauth-age"
                  type="number"
                  min="1"
                  [ngModel]="profileAge()"
                  (ngModelChange)="onAgeChange($event)"
                  required
                />
              </label>

              <label class="auth-field" for="oauth-level">
                <span>Nivel tecnico</span>
                <select
                  id="oauth-level"
                  name="oauth-level"
                  [ngModel]="profileTechnicalLevel()"
                  (ngModelChange)="profileTechnicalLevel.set($event)"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediario</option>
                  <option value="avancado">Avancado</option>
                </select>
              </label>

              <label class="auth-field auth-field--full" for="oauth-education">
                <span>Instituicao de ensino</span>
                <input
                  id="oauth-education"
                  name="oauth-education"
                  type="text"
                  [ngModel]="profileEducationInstitution()"
                  (ngModelChange)="profileEducationInstitution.set($event)"
                  autocomplete="organization"
                />
              </label>
            </div>

            <div class="auth-role-preview">
              <span class="auth-role-preview__label">Tipo de acesso atual</span>
              <strong>{{ roleLabel() }}</strong>
            </div>

            <label class="auth-check" for="oauth-terms">
              <input
                id="oauth-terms"
                name="oauth-terms"
                type="checkbox"
                [ngModel]="profileAcceptedTerms()"
                (ngModelChange)="profileAcceptedTerms.set(!!$event)"
              />
              <span>Li e aceito a Politica de Privacidade e os Termos de Uso.</span>
            </label>

            @if (profileErrorMessage()) {
              <p class="auth-gate__error" role="alert">{{ profileErrorMessage() }}</p>
            }

            <div class="auth-gate__actions">
              <button
                mat-flat-button
                class="auth-provider-button auth-provider-button--primary"
                type="submit"
                [disabled]="profileSaving()"
              >
                {{ profileSaving() ? 'Salvando...' : 'Salvar e continuar' }}
              </button>
            </div>
          </form>
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
        width: min(100%, 560px);
        max-height: min(92vh, 920px);
        padding: 28px;
        overflow: auto;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
        color: var(--fd-text);
      }

      .auth-gate__dialog--profile {
        width: min(100%, 680px);
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
      .auth-gate__dialog h2,
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

      .auth-mode-switch {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .auth-mode-switch__button {
        min-height: 44px;
        border: 1px solid var(--fd-border);
        background: transparent;
        color: var(--fd-soft);
        cursor: pointer;
      }

      .auth-mode-switch__button--active {
        border-color: var(--fd-accent);
        background: rgba(178, 45, 0, 0.12);
        color: var(--fd-text);
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

      .auth-gate__divider {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--fd-soft);
      }

      .auth-gate__divider span {
        flex: 1;
        height: 1px;
        background: var(--fd-border);
      }

      .auth-profile-form {
        display: grid;
        gap: 16px;
      }

      .auth-profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .auth-profile-grid--single {
        grid-template-columns: 1fr;
      }

      .auth-field {
        display: grid;
        gap: 8px;
      }

      .auth-field--full {
        grid-column: 1 / -1;
      }

      .auth-field span,
      .auth-check span {
        color: var(--fd-text);
        font-size: var(--fd-text-sm);
      }

      .auth-field input,
      .auth-field select {
        width: 100%;
        min-height: 48px;
        padding: 0 14px;
        border: 1px solid var(--fd-border);
        border-radius: var(--fd-radius);
        background: #111111;
        color: var(--fd-text);
        outline: none;
      }

      .auth-field input:focus,
      .auth-field select:focus {
        border-color: var(--fd-accent);
      }

      .auth-check {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .auth-check input {
        margin-top: 3px;
      }

      .auth-role-preview {
        display: grid;
        gap: 4px;
        padding: 14px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.02);
      }

      .auth-role-preview__label {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        text-transform: uppercase;
        letter-spacing: 0.08em;
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

      @media (max-width: 720px) {
        .auth-profile-grid {
          grid-template-columns: 1fr;
        }

        .auth-field--full {
          grid-column: auto;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  protected readonly authMode = signal<AuthMode>('login');
  protected readonly authSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly profileErrorMessage = signal('');
  protected readonly profileSaving = signal(false);

  protected readonly loginEmail = signal('');
  protected readonly loginPassword = signal('');

  protected readonly registerName = signal('');
  protected readonly registerEmail = signal('');
  protected readonly registerPassword = signal('');
  protected readonly registerWhatsapp = signal('');
  protected readonly registerAge = signal<number | null>(null);
  protected readonly registerTechnicalLevel = signal<TechnicalLevel | ''>('');
  protected readonly registerEducationInstitution = signal('');
  protected readonly registerAcceptedTerms = signal(false);

  protected readonly profileName = signal('');
  protected readonly profileWhatsapp = signal('');
  protected readonly profileAge = signal<number | null>(null);
  protected readonly profileTechnicalLevel = signal<TechnicalLevel | ''>('');
  protected readonly profileEducationInstitution = signal('');
  protected readonly profileAcceptedTerms = signal(false);

  private readonly currentUrl = signal(this.router.url);
  protected readonly isGateEnabled = computed(
    () => !this.auth.isAuthenticated() && !this.currentUrl().startsWith('/legal/')
  );
  protected readonly isProfileCompletionOpen = computed(() => {
    if (this.currentUrl().startsWith('/legal/')) {
      return false;
    }

    return this.auth.isAuthenticated() && this.auth.requiresProfileCompletion(this.auth.user());
  });
  protected readonly roleLabel = computed(() => {
    const role = this.auth.user()?.role ?? 'user';
    if (role === 'admin') {
      return 'Administrador';
    }

    if (role === 'instructor') {
      return 'Instrutor';
    }

    return 'Usuario comum';
  });

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.currentUrl.set((event as NavigationEnd).urlAfterRedirects);
    });

    this.syncProfileForm();
  }

  protected setAuthMode(mode: AuthMode): void {
    this.authMode.set(mode);
    this.errorMessage.set('');
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

  protected async submitEmailLogin(): Promise<void> {
    this.errorMessage.set('');
    this.authSubmitting.set(true);
    const result = await this.auth.signInWithEmail(this.loginEmail(), this.loginPassword());
    this.authSubmitting.set(false);
    this.errorMessage.set(result.ok ? '' : (result.message ?? 'Nao foi possivel entrar com e-mail e senha.'));
  }

  protected async submitEmailRegistration(): Promise<void> {
    this.errorMessage.set('');
    const technicalLevel = this.registerTechnicalLevel();
    if (!technicalLevel) {
      this.errorMessage.set('Selecione seu nivel tecnico para concluir o cadastro.');
      return;
    }

    this.authSubmitting.set(true);

    const result = await this.auth.registerWithEmail({
      name: this.registerName(),
      email: this.registerEmail(),
      password: this.registerPassword(),
      whatsappNumber: this.registerWhatsapp(),
      age: this.registerAge(),
      technicalLevel,
      educationInstitution: this.registerEducationInstitution(),
      acceptedTerms: this.registerAcceptedTerms()
    });

    this.authSubmitting.set(false);
    this.errorMessage.set(result.ok ? (result.message ?? '') : (result.message ?? 'Nao foi possivel concluir o cadastro.'));
  }

  protected onAgeChange(value: string | number | null): void {
    this.profileAge.set(this.normalizeAge(value));
  }

  protected onRegisterAgeChange(value: string | number | null): void {
    this.registerAge.set(this.normalizeAge(value));
  }

  protected async submitProfileCompletion(): Promise<void> {
    this.profileErrorMessage.set('');
    this.profileSaving.set(true);

    const result = await this.auth.completeOAuthProfile({
      name: this.profileName(),
      whatsappNumber: this.profileWhatsapp(),
      age: this.profileAge(),
      technicalLevel: this.profileTechnicalLevel() || null,
      educationInstitution: this.profileEducationInstitution(),
      acceptedTerms: this.profileAcceptedTerms()
    });

    this.profileSaving.set(false);
    this.profileErrorMessage.set(result.ok ? '' : (result.message ?? 'Nao foi possivel salvar seus dados.'));
  }

  private normalizeAge(value: string | number | null): number | null {
    const next = Number(value);
    return Number.isFinite(next) && next > 0 ? next : null;
  }

  private syncProfileForm(): void {
    effect(() => {
      const user = this.auth.user();
      this.profileName.set(user?.name ?? '');
      this.profileWhatsapp.set(user?.whatsappNumber ?? '');
      this.profileAge.set(user?.age ?? null);
      this.profileTechnicalLevel.set(user?.technicalLevel ?? '');
      this.profileEducationInstitution.set(user?.educationInstitution ?? '');
      this.profileAcceptedTerms.set(Boolean(user?.acceptedTerms));
    });
  }
}
