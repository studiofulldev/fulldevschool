import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter } from 'rxjs';
import { AuthService, TechnicalLevel } from './services/auth.service';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="app-root" [class.app-root--locked]="isGateEnabled() || isProfileCompletionOpen()">
      <router-outlet />
    </div>

    @if (isRouteLoading()) {
      <div class="global-loading" aria-hidden="true">
        <div class="global-loading__backdrop"></div>
        <section class="global-loading__dialog">
          <div class="global-loading__body">
            <div class="global-loading__line global-loading__line--eyebrow"></div>
            <div class="global-loading__line global-loading__line--title"></div>
            <div class="global-loading__line global-loading__line--text"></div>
            <div class="global-loading__line global-loading__line--panel"></div>
            <div class="global-loading__grid">
              <div class="global-loading__card"></div>
              <div class="global-loading__card"></div>
              <div class="global-loading__card"></div>
            </div>
          </div>
        </section>
      </div>
    }

    @if (isGateEnabled()) {
      <div class="auth-gate">
        <div class="auth-gate__backdrop"></div>

        <section class="auth-gate__dialog" aria-modal="true" role="dialog" aria-labelledby="auth-gate-title">
          <div class="auth-login-card__body">
            @if (!isAuthRedirecting()) {
              <div class="auth-login-card__intro">
                <img class="auth-login-card__logo" src="/logo-fulldev.svg" alt="Fulldev School" />
                <div class="auth-gate__trust-badge">Ambiente 100% seguro</div>
                <div class="auth-login-card__copy">
                  <h1 id="auth-gate-title">Fala Dev, Bem-vindo de Volta!</h1>
                  <p>Entre com Google ou LinkedIn para continuar.</p>
                </div>
              </div>

              <div class="auth-login-card__socials">
                <button
                  mat-stroked-button
                  class="auth-social-button"
                  type="button"
                  (click)="signInWithGoogle()"
                  [disabled]="!supabase.isConfigured || isAuthRedirecting()"
                >
                  <span>Google</span>
                </button>

                <button
                  mat-stroked-button
                  class="auth-social-button"
                  type="button"
                  (click)="signInWithLinkedIn()"
                  [disabled]="!supabase.isConfigured || isAuthRedirecting()"
                >
                  <span>LinkedIn</span>
                </button>
              </div>
            } @else {
              <div class="auth-loading-card">
                <img class="auth-loading-card__logo" src="/logo-fulldev.svg" alt="Fulldev School" />
                <div class="auth-loading-card__copy">
                  <h1 id="auth-gate-title">Quase la!</h1>
                  <p>Estamos confirmando seus dados</p>
                </div>
              </div>
            }
          </div>
        </section>
      </div>
    }

    @if (isProfileCompletionOpen()) {
      <div class="auth-gate">
        <div class="auth-gate__backdrop"></div>

        <section class="auth-gate__dialog auth-gate__dialog--profile" aria-modal="true" role="dialog" aria-labelledby="profile-gate-title">
          <div class="auth-login-card__body auth-login-card__body--wizard">
            <form class="auth-profile-form auth-step-card" (ngSubmit)="submitProfileCompletion()">
              <div class="auth-step-card__intro">
                <img class="auth-step-card__logo" src="/logo-fulldev.svg" alt="Fulldev School" />
                <div class="auth-gate__trust-badge">Ambiente 100% seguro</div>
                <h2 id="profile-gate-title">{{ profileStepTitle() }}</h2>
              </div>

              @if (profileStep() === 1) {
                <div class="auth-profile-grid auth-profile-grid--single auth-profile-grid--floating auth-step-card__fields">
                  <div class="auth-avatar-field">
                    <img class="auth-avatar-field__preview" [src]="profileAvatarPreview()" alt="Avatar do usuario" />
                    <div class="auth-avatar-field__copy">
                      <strong>Foto do perfil</strong>
                      <span>Se o provedor nao enviar uma foto, usaremos o avatar padrao por enquanto.</span>
                    </div>
                  </div>

                  <label class="auth-field auth-field--floating" for="oauth-first-name">
                    <span>Primeiro nome*</span>
                    <input
                      id="oauth-first-name"
                      name="oauth-first-name"
                      type="text"
                      [ngModel]="profileFirstName()"
                      (ngModelChange)="profileFirstName.set($event)"
                      autocomplete="given-name"
                      required
                    />
                  </label>

                  <label class="auth-field auth-field--floating" for="oauth-last-name">
                    <span>Segundo nome</span>
                    <input
                      id="oauth-last-name"
                      name="oauth-last-name"
                      type="text"
                      [ngModel]="profileLastName()"
                      (ngModelChange)="profileLastName.set($event)"
                      autocomplete="family-name"
                    />
                  </label>
                </div>
              }

              @if (profileStep() === 2) {
                <div class="auth-profile-grid auth-profile-grid--single auth-profile-grid--floating auth-step-card__fields">
                  <label class="auth-field auth-field--floating" for="oauth-whatsapp">
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

                  <label class="auth-field auth-field--floating" for="oauth-age">
                    <span>Idade*</span>
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

                  <label class="auth-field auth-field--floating" for="oauth-level">
                    <span>Nivel tecnico*</span>
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

                  <label class="auth-field auth-field--floating" for="oauth-education">
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
              }

              @if (profileStep() === 3) {
                <div class="auth-profile-grid auth-profile-grid--single auth-profile-grid--floating auth-step-card__fields">
                  <label class="auth-field auth-field--floating" for="oauth-email">
                    <span>E-mail</span>
                    <input
                      id="oauth-email"
                      name="oauth-email"
                      type="email"
                      [ngModel]="profileEmail()"
                      autocomplete="email"
                      readonly
                    />
                  </label>
                </div>

                <label class="auth-check auth-check--register" for="oauth-terms">
                  <input
                    id="oauth-terms"
                    name="oauth-terms"
                    type="checkbox"
                    [ngModel]="profileAcceptedTerms()"
                    (ngModelChange)="profileAcceptedTerms.set(!!$event)"
                  />
                  <span>Li e aceito os termos do cadastro.</span>
                </label>
              }

              <div class="auth-step-card__progress" aria-hidden="true">
                @for (step of registerSteps; track step) {
                  <span [class.auth-step-card__progress-dot--active]="profileStep() === step"></span>
                }
              </div>

              <div class="auth-step-card__actions">
                @if (profileStep() < 3) {
                  <button
                    mat-flat-button
                    class="auth-provider-button auth-provider-button--primary auth-provider-button--solid"
                    type="button"
                    (click)="goToNextProfileStep()"
                    [disabled]="profileSaving()"
                  >
                    <span class="auth-button__content" [class.auth-button__content--loading]="profileSaving()">
                      @if (profileSaving()) {
                        <span class="auth-button__spinner" aria-hidden="true"></span>
                      }
                      <span>{{ profileSaving() ? 'Carregando...' : 'Proximo' }}</span>
                    </span>
                  </button>
                } @else {
                  <button
                    mat-flat-button
                    class="auth-provider-button auth-provider-button--primary auth-provider-button--solid"
                    type="submit"
                    [disabled]="profileSaving()"
                  >
                    <span class="auth-button__content" [class.auth-button__content--loading]="profileSaving()">
                      @if (profileSaving()) {
                        <span class="auth-button__spinner" aria-hidden="true"></span>
                      }
                      <span>{{ profileSaving() ? 'Salvando...' : 'Concluir cadastro' }}</span>
                    </span>
                  </button>
                }
                <button
                  type="button"
                  class="auth-step-card__secondary-action"
                  (click)="profileStep() === 1 ? cancelOAuthCompletion() : goToPreviousProfileStep()"
                  [disabled]="profileSaving()"
                >
                  {{ profileStep() === 1 ? 'Cancelar' : 'Voltar' }}
                </button>
              </div>
            </form>
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

      .global-loading {
        position: fixed;
        inset: 0;
        z-index: 1900;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .global-loading__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(10, 10, 10, 0.34);
        backdrop-filter: blur(8px);
      }

      .global-loading__dialog {
        position: relative;
        z-index: 1;
        width: min(100%, 920px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        background: rgba(20, 20, 20, 0.9);
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.32);
      }

      .global-loading__body {
        display: grid;
        gap: 18px;
        padding: 32px;
      }

      .global-loading__grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .global-loading__line,
      .global-loading__card {
        position: relative;
        overflow: hidden;
        border-radius: 14px;
        background: #262626;
      }

      .global-loading__line::after,
      .global-loading__card::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.14) 50%, transparent 100%);
        animation: app-skeleton 1.25s ease-in-out infinite;
      }

      .global-loading__line--eyebrow {
        width: 148px;
        height: 18px;
      }

      .global-loading__line--title {
        width: min(100%, 320px);
        height: 40px;
      }

      .global-loading__line--text {
        width: min(100%, 420px);
        height: 20px;
      }

      .global-loading__line--panel {
        width: 100%;
        height: 180px;
      }

      .global-loading__card {
        min-height: 120px;
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
        gap: 0;
        width: min(100%, 472px);
        max-height: min(92vh, 920px);
        overflow: auto;
        border: 1px solid #4c4c4c;
        background: #1f1f1f;
        color: var(--fd-text);
        border-radius: 4px;
      }

      .auth-gate__dialog--profile {
        width: min(100%, 680px);
      }

      .auth-login-card__body {
        display: grid;
        gap: 32px;
        padding: 58px 44px 42px;
      }

      .auth-login-card__body--wizard {
        gap: 28px;
      }

      .auth-login-card__intro {
        display: grid;
        gap: 18px;
        justify-items: center;
      }

      .auth-login-card__logo {
        width: 88px;
        height: auto;
      }

      .auth-login-card__copy {
        display: grid;
        gap: 10px;
        text-align: center;
      }

      .auth-login-card__copy--register {
        justify-items: center;
      }

      .auth-gate__dialog h1,
      .auth-gate__dialog h2,
      .auth-gate__dialog p {
        margin: 0;
      }

      .auth-gate__dialog h1 {
        font-size: 24px;
        font-weight: 600;
        line-height: 1.2;
      }

      .auth-gate__dialog p {
        color: var(--fd-muted);
        font-size: 16px;
      }

      .auth-gate__trust-badge {
        width: fit-content;
        min-height: 32px;
        padding: 0 16px;
        border: 1px solid #4c4c4c;
        background: #2c2c2c;
        color: #bababa;
        display: inline-flex;
        align-items: center;
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border-radius: 999px;
      }

      .auth-gate__actions,
      .auth-gate__form {
        display: grid;
        gap: 18px;
      }

      .auth-login-card__form-area {
        display: grid;
        gap: 18px;
      }

      .auth-login-card__forgot {
        justify-self: end;
        color: #bababa;
        font-size: 14px;
        text-decoration: none;
      }

      .auth-login-card__forgot:hover {
        color: #ffffff;
      }

      .auth-login-card__divider {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        color: #cccccc;
        font-size: 14px;
      }

      .auth-login-card__divider span {
        flex: 1;
        height: 1px;
        background: #4c4c4c;
      }

      .auth-login-card__socials {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .auth-social-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        border: 1px solid #4c4c4c !important;
        background: #4c4c4c !important;
        color: #ffffff !important;
        border-radius: 4px !important;
        box-shadow: none !important;
      }

      .auth-social-button:hover {
        background: #5b5b5b !important;
      }

      .auth-login-card__register-copy {
        color: #bababa;
        font-size: 14px;
        text-align: right;
        margin-top: 4px;
      }

      .auth-provider-button {
        width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding-inline: 18px;
        border-radius: 4px;
        font-weight: 600;
        box-shadow: none !important;
      }

      .auth-provider-button--primary {
        border: 1px solid var(--fd-accent) !important;
        color: var(--fd-white) !important;
        background: var(--fd-accent) !important;
      }

      .auth-provider-button--solid {
        min-height: 48px;
        border-radius: 4px !important;
      }

      .auth-provider-button--linkedin {
        border: 1px solid #0a66c2 !important;
        color: #ffffff !important;
        background: #0a66c2 !important;
      }

      .auth-provider-button--linkedin:hover {
        border-color: #004182 !important;
        background: #004182 !important;
      }

      .auth-provider-button--primary:hover {
        border-color: var(--fd-accent-strong) !important;
        background: var(--fd-accent-strong) !important;
      }

      .auth-profile-form {
        display: grid;
        gap: 28px;
      }

      .auth-profile-form--register {
        margin-top: 4px;
      }

      .auth-profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .auth-profile-grid--single {
        grid-template-columns: 1fr;
      }

      .auth-field {
        display: grid;
        gap: 8px;
      }

      .auth-field--floating {
        position: relative;
        gap: 0;
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
        min-height: 52px;
        padding: 0 14px;
        border: 1px solid #4c4c4c;
        border-radius: 4px;
        background: #2c2c2c;
        color: var(--fd-text);
        outline: none;
      }

      .auth-field--floating span {
        position: absolute;
        top: -8px;
        left: 10px;
        padding: 0 2px;
        color: #bababa;
        background: linear-gradient(180deg, #1f1f1f 0%, #1f1f1f 50%, #2c2c2c 50%, #2c2c2c 100%);
        font-size: 14px;
        font-weight: 300;
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

      .auth-gate__register-link {
        margin-left: 4px;
        color: #696969;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
      }

      .auth-gate__register-link:hover {
        color: #ffffff;
      }

      .auth-step-card {
        gap: 28px;
      }

      .auth-step-card__intro {
        display: grid;
        gap: 18px;
        justify-items: center;
        text-align: center;
      }

      .auth-step-card__logo {
        width: 88px;
        height: auto;
      }

      .auth-step-card__fields {
        gap: 16px;
      }

      .auth-avatar-field {
        display: grid;
        justify-items: center;
        gap: 14px;
        padding: 8px 0 4px;
        text-align: center;
      }

      .auth-avatar-field__preview {
        width: 92px;
        height: 92px;
        border: 1px solid #4c4c4c;
        border-radius: 999px;
        object-fit: cover;
        background: #2c2c2c;
      }

      .auth-avatar-field__copy {
        display: grid;
        gap: 6px;
        max-width: 360px;
      }

      .auth-avatar-field__copy strong {
        font-size: 16px;
        font-weight: 600;
      }

      .auth-avatar-field__copy span {
        color: var(--fd-muted);
        font-size: 14px;
        line-height: 1.5;
      }

      .auth-step-card__progress {
        display: flex;
        justify-content: center;
        gap: 10px;
      }

      .auth-step-card__progress span {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #4c4c4c;
      }

      .auth-step-card__progress-dot--active {
        background: var(--fd-accent) !important;
      }

      .auth-step-card__actions {
        display: grid;
        gap: 14px;
      }

      .auth-step-card__secondary-action {
        min-height: 48px;
        border: 1px solid #4c4c4c;
        border-radius: 4px;
        background: transparent;
        color: #ffffff;
        font: inherit;
        cursor: pointer;
      }

      .auth-step-card__secondary-action:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      .auth-loading-card {
        display: grid;
        justify-items: center;
        align-content: center;
        gap: 18px;
        min-height: 200px;
        text-align: center;
      }

      .auth-loading-card__logo {
        width: 60px;
        height: auto;
      }

      .auth-loading-card__copy {
        display: grid;
        gap: 6px;
      }

      .auth-button__content {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      .auth-button__content--loading {
        opacity: 0.96;
      }

      .auth-button__spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.28);
        border-top-color: #ffffff;
        border-radius: 999px;
        animation: auth-spin 0.8s linear infinite;
      }

      :host ::ng-deep .auth-toast {
        min-width: 320px;
        border-radius: 12px;
      }

      :host ::ng-deep .auth-toast .mat-mdc-snack-bar-label {
        color: #f6f6f6;
      }

      :host ::ng-deep .auth-toast--success {
        --mdc-snackbar-container-color: #1e7a4f;
      }

      :host ::ng-deep .auth-toast--error {
        --mdc-snackbar-container-color: #a93b32;
      }

      :host ::ng-deep .auth-toast--warning {
        --mdc-snackbar-container-color: #8a6420;
      }

      @media (max-width: 720px) {
        .global-loading__grid {
          grid-template-columns: 1fr;
        }

        .auth-profile-grid {
          grid-template-columns: 1fr;
        }

        .auth-field--full {
          grid-column: auto;
        }
      }

      @keyframes auth-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes app-skeleton {
        to {
          transform: translateX(100%);
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly supabase = inject(SupabaseService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly profileStep = signal<1 | 2 | 3>(1);
  protected readonly isAuthRedirecting = signal(false);
  protected readonly isRouteLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly profileErrorMessage = signal('');
  protected readonly profileSaving = signal(false);
  protected readonly registerSteps: Array<1 | 2 | 3> = [1, 2, 3];

  protected readonly profileFirstName = signal('');
  protected readonly profileLastName = signal('');
  protected readonly profileEmail = signal('');
  protected readonly profileWhatsapp = signal('');
  protected readonly profileAge = signal<number | null>(null);
  protected readonly profileTechnicalLevel = signal<TechnicalLevel | ''>('');
  protected readonly profileEducationInstitution = signal('');
  protected readonly profileAcceptedTerms = signal(false);

  private readonly currentUrl = signal(this.router.url);
  protected readonly isGateEnabled = computed(
    () =>
      this.auth.sessionCheckComplete() &&
      !this.auth.isAuthenticated() &&
      !this.currentUrl().startsWith('/legal/') &&
      !this.currentUrl().startsWith('/login')
  );
  protected readonly profileAvatarPreview = computed(() => this.auth.user()?.avatarUrl || '/user-default.jpg');
  protected readonly isProfileCompletionOpen = computed(() => {
    if (!this.auth.sessionCheckComplete() || this.currentUrl().startsWith('/legal/') || this.currentUrl().startsWith('/login')) {
      return false;
    }

    return this.auth.isAuthenticated() && this.auth.requiresProfileCompletion(this.auth.user());
  });
  constructor() {
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
        )
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.isRouteLoading.set(true);
          return;
        }

        if (event instanceof NavigationEnd) {
          this.currentUrl.set(event.urlAfterRedirects);
        }

        this.isRouteLoading.set(false);
      });

    this.syncProfileForm();
    this.warnIfSupabaseMissing();
  }

  protected goToNextProfileStep(): void {
    this.profileErrorMessage.set('');

    if (this.profileStep() === 1 && !this.profileFirstName().trim()) {
      this.showToast('warning', 'Preencha o primeiro nome para continuar.');
      return;
    }

    if (this.profileStep() === 2 && (!this.profileAge() || !this.profileTechnicalLevel())) {
      this.showToast('warning', 'Preencha idade e nivel tecnico para continuar.');
      return;
    }

    this.profileStep.update((current) => (current < 3 ? ((current + 1) as 1 | 2 | 3) : current));
  }

  protected goToPreviousProfileStep(): void {
    this.profileErrorMessage.set('');
    this.profileStep.update((current) => (current > 1 ? ((current - 1) as 1 | 2 | 3) : current));
  }

  protected profileStepTitle = computed(() => {
    if (this.profileStep() === 1) {
      return 'Detalhes pessoais';
    }

    if (this.profileStep() === 2) {
      return 'Complete seu cadastro';
    }

    return 'Confirme seu acesso';
  });

  protected async signInWithGoogle(): Promise<void> {
    this.errorMessage.set('');
    this.isAuthRedirecting.set(true);
    const result = await this.auth.signInWithGoogle();
    if (!result.ok) {
      this.isAuthRedirecting.set(false);
      this.showToast('error', result.message ?? 'Nao foi possivel entrar com Google.');
    }
  }

  protected async signInWithLinkedIn(): Promise<void> {
    this.errorMessage.set('');
    this.isAuthRedirecting.set(true);
    const result = await this.auth.signInWithLinkedIn();
    if (!result.ok) {
      this.isAuthRedirecting.set(false);
      this.showToast('error', result.message ?? 'Nao foi possivel entrar com LinkedIn.');
    }
  }

  protected onAgeChange(value: string | number | null): void {
    this.profileAge.set(this.normalizeAge(value));
  }

  protected async submitProfileCompletion(): Promise<void> {
    this.profileErrorMessage.set('');
    if (this.profileStep() !== 3) {
      this.goToNextProfileStep();
      return;
    }

    if (!this.profileAcceptedTerms()) {
      this.showToast('warning', 'Voce precisa aceitar os termos para concluir o cadastro.');
      return;
    }

    this.profileSaving.set(true);
    const name = [this.profileFirstName().trim(), this.profileLastName().trim()].filter(Boolean).join(' ');

    const result = await this.auth.completeOAuthProfile({
      name,
      whatsappNumber: this.profileWhatsapp(),
      age: this.profileAge(),
      technicalLevel: this.profileTechnicalLevel() || null,
      educationInstitution: this.profileEducationInstitution(),
      acceptedTerms: this.profileAcceptedTerms()
    });

    this.profileSaving.set(false);
    if (!result.ok) {
      this.showToast('error', result.message ?? 'Nao foi possivel salvar seus dados.');
      return;
    }

    this.showToast('success', 'Cadastro complementar salvo com sucesso.');
  }

  protected cancelOAuthCompletion(): void {
    this.profileStep.set(1);
    void this.auth.signOut();
  }

  private normalizeAge(value: string | number | null): number | null {
    const next = Number(value);
    return Number.isFinite(next) && next > 0 ? next : null;
  }

  private showToast(kind: 'success' | 'error' | 'warning', message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['auth-toast', `auth-toast--${kind}`]
    });
  }

  private warnIfSupabaseMissing(): void {
    effect(() => {
      if (this.supabase.isConfigured || !this.supabase.configError) {
        return;
      }

      this.showToast('warning', this.supabase.configError);
    });
  }

  private syncProfileForm(): void {
    effect(() => {
      const user = this.auth.user();
      const [firstName = '', ...rest] = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
      this.profileFirstName.set(firstName);
      this.profileLastName.set(rest.join(' '));
      this.profileEmail.set(user?.email ?? '');
      this.profileWhatsapp.set(user?.whatsappNumber ?? '');
      this.profileAge.set(user?.age ?? null);
      this.profileTechnicalLevel.set(user?.technicalLevel ?? '');
      this.profileEducationInstitution.set(user?.educationInstitution ?? '');
      this.profileAcceptedTerms.set(Boolean(user?.acceptedTerms));
      this.profileStep.set(1);
      this.profileErrorMessage.set('');
      this.isAuthRedirecting.set(false);
    });
  }
}
