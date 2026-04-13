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
  templateUrl: './platform-shell.component.html',
  styleUrl: './platform-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  protected readonly userAvatarUrl = computed(() => this.auth.user()?.avatarUrl || '/user-default.jpg');
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

  protected goToPrivacy(): void {
    void this.router.navigateByUrl('/legal/privacy');
  }

  protected goToTerms(): void {
    void this.router.navigateByUrl('/legal/terms');
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
