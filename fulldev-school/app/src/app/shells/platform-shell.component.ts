import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-platform-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatMenuModule],
  template: `
    <div class="platform-shell">
      <aside class="platform-sidebar">
        <header class="platform-sidebar__header">
          <img class="platform-sidebar__logo platform-sidebar__logo--compact" src="logo-fulldev.svg" alt="Fulldev" />
          <img
            class="platform-sidebar__logo platform-sidebar__logo--full"
            [src]="theme.isDark() ? 'logo-completa-branca.png' : 'logo-completa-preta.png'"
            alt="Fulldev"
          />
        </header>

        <nav class="platform-sidebar__nav" aria-label="Navegacao da plataforma">
          <a class="platform-nav-item" routerLink="/courses/home" routerLinkActive="is-active">
            <mat-icon>home</mat-icon>
            <span>Home</span>
          </a>

          <a class="platform-nav-item" routerLink="/courses/catalog" routerLinkActive="is-active">
            <mat-icon>school</mat-icon>
            <span>Cursos</span>
          </a>
        </nav>

        <div class="platform-sidebar__account">
          <a class="platform-nav-item" routerLink="/courses/account" routerLinkActive="is-active">
            <mat-icon>person</mat-icon>
            <span>Minha conta</span>
          </a>
        </div>
      </aside>

      <div class="platform-main">
        <header class="platform-header">
          <div class="platform-header__copy">
            <span class="platform-header__eyebrow">Guia de tecnologia</span>
            <strong>Fulldev School</strong>
          </div>

          @if (auth.user(); as user) {
            <button class="platform-user" type="button" [matMenuTriggerFor]="userMenu">
              <div class="platform-user__meta">
                <strong>{{ user.name }}</strong>
              </div>

              @if (user.avatarUrl) {
                <img [src]="user.avatarUrl" [alt]="user.name" />
              } @else {
                <span class="platform-user__avatar">{{ userInitials() }}</span>
              }
            </button>

            <mat-menu #userMenu="matMenu" xPosition="before">
              <button mat-menu-item type="button" (click)="goToAccount()">
                <mat-icon>person</mat-icon>
                <span>Minha conta</span>
              </button>
              <button mat-menu-item type="button" (click)="signOut()">
                <mat-icon>logout</mat-icon>
                <span>Deslogar</span>
              </button>
            </mat-menu>
          }
        </header>

        <main class="platform-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --platform-header-height: 80px;
        --platform-sidebar-collapsed: 84px;
        --platform-sidebar-expanded: 260px;
        display: block;
        min-height: 100vh;
      }

      .platform-shell {
        min-height: 100vh;
        background: var(--fd-page-bg);
        color: var(--fd-text);
      }

      .platform-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 60;
        display: flex;
        flex-direction: column;
        width: var(--platform-sidebar-collapsed);
        border-right: 1px solid var(--fd-border);
        background: var(--fd-surface-header);
        overflow: hidden;
        transition: width var(--fd-motion-fast);
      }

      .platform-sidebar:hover,
      .platform-sidebar:focus-within {
        width: var(--platform-sidebar-expanded);
      }

      .platform-sidebar__header {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        height: var(--platform-header-height);
        padding: 0 18px;
        border-bottom: 1px solid var(--fd-border);
        background: var(--fd-surface-header);
      }

      .platform-sidebar__logo {
        display: block;
        width: 100%;
        max-height: calc(var(--platform-header-height) - 24px);
        object-fit: contain;
        transition: opacity var(--fd-motion-fast);
      }

      .platform-sidebar__logo--compact {
        max-width: 40px;
      }

      .platform-sidebar__logo--full {
        position: absolute;
        inset: 0;
        width: calc(100% - 36px);
        max-width: 176px;
        height: 100%;
        margin: auto;
        opacity: 0;
      }

      .platform-sidebar__nav,
      .platform-sidebar__account {
        display: grid;
        gap: 8px;
        padding: 16px 12px;
      }

      .platform-sidebar__account {
        margin-top: auto;
        border-top: 1px solid var(--fd-border);
      }

      .platform-nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 44px;
        padding: 0 14px;
        color: var(--fd-muted);
        text-decoration: none;
        white-space: nowrap;
        border: 1px solid transparent;
      }

      .platform-sidebar:not(:hover):not(:focus-within) .platform-nav-item {
        justify-content: center;
        padding: 0;
      }

      .platform-nav-item span {
        opacity: 0;
        transition: opacity var(--fd-motion-fast);
      }

      .platform-sidebar:hover .platform-nav-item span,
      .platform-sidebar:focus-within .platform-nav-item span {
        opacity: 1;
      }

      .platform-sidebar:hover .platform-sidebar__logo--compact,
      .platform-sidebar:focus-within .platform-sidebar__logo--compact {
        opacity: 0;
      }

      .platform-sidebar:hover .platform-sidebar__logo--full,
      .platform-sidebar:focus-within .platform-sidebar__logo--full {
        opacity: 1;
      }

      .platform-nav-item.is-active,
      .platform-nav-item:hover {
        color: var(--fd-white);
        background: var(--fd-nav-active);
        border-color: var(--fd-border);
      }

      .platform-main {
        min-width: 0;
        margin-left: var(--platform-sidebar-collapsed);
        transition: margin-left var(--fd-motion-fast);
      }

      .platform-sidebar:hover + .platform-main,
      .platform-sidebar:focus-within + .platform-main {
        margin-left: var(--platform-sidebar-expanded);
      }

      .platform-header {
        position: fixed;
        top: 0;
        left: var(--platform-sidebar-collapsed);
        right: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        height: var(--platform-header-height);
        padding: 0 20px;
        border-bottom: 1px solid var(--fd-border);
        background: var(--fd-surface-header);
        transition: left var(--fd-motion-fast);
      }

      .platform-sidebar:hover + .platform-main .platform-header,
      .platform-sidebar:focus-within + .platform-main .platform-header {
        left: var(--platform-sidebar-expanded);
      }

      .platform-header__copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .platform-header__eyebrow {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .platform-user {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        min-height: 48px;
        padding: 0 12px;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
        color: var(--fd-text);
        cursor: pointer;
      }

      .platform-user__meta {
        display: grid;
      }

      .platform-user img,
      .platform-user__avatar {
        width: 36px;
        height: 36px;
        flex: 0 0 36px;
      }

      .platform-user img {
        object-fit: cover;
      }

      .platform-user__avatar {
        display: grid;
        place-items: center;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.04);
        font-size: 0.8rem;
        font-weight: 700;
      }

      .platform-content {
        padding: calc(var(--platform-header-height) + 24px) 24px 24px;
      }

      @media (max-width: 960px) {
        :host {
          --platform-header-height: 88px;
        }

        .platform-sidebar,
        .platform-sidebar:hover,
        .platform-sidebar:focus-within {
          position: static;
          width: 100%;
        }

        .platform-nav-item span {
          opacity: 1;
        }

        .platform-sidebar__logo--compact {
          opacity: 0;
        }

        .platform-sidebar__logo--full {
          opacity: 1;
        }

        .platform-main,
        .platform-sidebar:hover + .platform-main,
        .platform-sidebar:focus-within + .platform-main {
          margin-left: 0;
        }

        .platform-header,
        .platform-sidebar:hover + .platform-main .platform-header,
        .platform-sidebar:focus-within + .platform-main .platform-header {
          left: 0;
        }

        .platform-header {
          height: auto;
          min-height: var(--platform-header-height);
          padding: 16px;
          flex-wrap: wrap;
        }

        .platform-content {
          padding: calc(var(--platform-header-height) + 18px) 16px 16px;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  protected readonly userInitials = computed(() => {
    const user = this.auth.user();
    if (!user) {
      return 'FS';
    }

    return user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  protected goToAccount(): void {
    void this.router.navigateByUrl('/courses/account');
  }

  protected signOut(): void {
    this.auth.signOut();
  }
}
