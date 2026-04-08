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
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
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
