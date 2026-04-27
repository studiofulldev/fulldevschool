import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/auth.service';

type NavItem = {
  label: string;
  icon: string;
  to: string;
};

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [
    NgIf,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav
        class="sidebar"
        [mode]="'side'"
        [opened]="true"
        [fixedInViewport]="true"
        [fixedTopGap]="0"
        [fixedBottomGap]="0"
      >
        <div class="sidebar-header">
          <div class="brand" [class.brand--collapsed]="collapsed()">
            <div class="brand-mark">FD</div>
            <div class="brand-text" *ngIf="!collapsed()">FullDev School</div>
          </div>

          <button mat-icon-button type="button" (click)="toggleCollapsed()" aria-label="Recolher sidebar">
            <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>

        <mat-nav-list class="nav">
          <a
            mat-list-item
            *ngFor="let item of navItems()"
            [routerLink]="item.to"
            routerLinkActive="nav-item--active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle *ngIf="!collapsed()">{{ item.label }}</span>
          </a>
        </mat-nav-list>

        <div class="sidebar-footer">
          <a mat-list-item [routerLink]="'/app/profile'" routerLinkActive="nav-item--active">
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle *ngIf="!collapsed()">Perfil</span>
          </a>

          <button mat-list-item type="button" (click)="logout()">
            <mat-icon matListItemIcon>logout</mat-icon>
            <span matListItemTitle *ngIf="!collapsed()">Logout</span>
          </button>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="content">
        <div class="content-inner">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .shell {
        height: 100vh;
        background: #0b0f19;
      }

      .sidebar {
        width: 280px;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        background: #0b0f19;
        color: #e8eaf0;
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 12px;
        gap: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .brand--collapsed {
        gap: 0;
      }

      .brand-mark {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(135deg, #7c3aed, #22d3ee);
        color: #070a12;
        display: grid;
        place-items: center;
        font-weight: 800;
        letter-spacing: 0.02em;
        flex: 0 0 auto;
      }

      .brand-text {
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .nav {
        padding-top: 8px;
      }

      .sidebar-footer {
        margin-top: auto;
        padding: 8px 0;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
      }

      .content {
        background: #0b0f19;
        color: #e8eaf0;
      }

      .content-inner {
        padding: 24px;
        max-width: 1200px;
      }

      :host ::ng-deep .mat-mdc-list-item {
        border-radius: 12px;
        margin: 4px 12px;
        overflow: hidden;
      }

      :host ::ng-deep .nav-item--active {
        background: rgba(124, 58, 237, 0.18);
      }

      :host ::ng-deep .mat-mdc-list-item .mdc-list-item__primary-text {
        color: #e8eaf0;
      }

      :host ::ng-deep .mat-mdc-list-item .mat-icon {
        color: rgba(232, 234, 240, 0.85);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardShellComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly collapsed = signal(false);

  readonly navItems = computed<NavItem[]>(() => [
    { label: 'Home', icon: 'home', to: '/app/home' },
    { label: 'Cursos', icon: 'school', to: '/app/courses' },
    { label: 'Mentoria', icon: 'support_agent', to: '/app/mentoring' }
  ]);

  toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
    const sidenavEl = document.querySelector('mat-sidenav.sidebar') as HTMLElement | null;
    if (sidenavEl) {
      sidenavEl.style.width = this.collapsed() ? '88px' : '280px';
    }
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/');
  }
}

