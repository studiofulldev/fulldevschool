import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, take } from 'rxjs';
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    // Safety net: if the user lands on /login already authenticated (e.g. after OAuth
    // redirect when the guard fired too early), navigate them to the intended destination.
    // Uses take(1) so the subscription self-completes on first truthy emission.
    toObservable(this.auth.isAuthenticated)
      .pipe(filter(Boolean), take(1))
      .subscribe(() => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
        // Strip any hash fragment — tokens must not be forwarded as a path segment.
        const cleanUrl = returnUrl?.split('#')[0] ?? '/app/home';
        const safeUrl = cleanUrl.startsWith('/') ? cleanUrl : '/app/home';
        void this.router.navigateByUrl(safeUrl);
      });
  }

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
