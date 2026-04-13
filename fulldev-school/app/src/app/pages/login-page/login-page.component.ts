import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected async signInWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    const result = await this.auth.signInWithGoogle();
    if (!result.ok) {
      this.errorMessage.set(result.message ?? 'Nao foi possivel entrar com Google.');
      this.loading.set(false);
    }
  }

  protected async signInWithLinkedIn(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    const result = await this.auth.signInWithLinkedIn();
    if (!result.ok) {
      this.errorMessage.set(result.message ?? 'Nao foi possivel entrar com LinkedIn.');
      this.loading.set(false);
    }
  }
}
