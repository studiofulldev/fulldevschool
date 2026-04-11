import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Wait for the initial Supabase session check to complete before making
// an auth decision. This prevents the guard from redirecting valid sessions
// to /login during the brief async window before the session is verified.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.sessionCheckComplete()) {
    return auth.isAuthenticated() ? true : router.createUrlTree(['/']);
  }

  return auth.sessionCheckComplete$.pipe(
    map(() => auth.isAuthenticated() ? true : router.createUrlTree(['/']))
  );
};
