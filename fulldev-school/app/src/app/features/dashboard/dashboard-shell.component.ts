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
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
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
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/');
  }
}
