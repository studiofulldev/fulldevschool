import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter } from 'rxjs';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatSnackBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  protected readonly isRouteLoading = signal(false);

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

        this.isRouteLoading.set(false);
      });

    effect(() => {
      if (this.supabase.isConfigured || !this.supabase.configError) {
        return;
      }

      this.snackBar.open(this.supabase.configError, 'Fechar', {
        duration: 4500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['auth-toast', 'auth-toast--warning']
      });
    });
  }
}
