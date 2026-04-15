import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Wait for the initial Supabase session check to complete before making
// an auth decision. This prevents the guard from redirecting valid sessions
// to /login during the brief async window before the session is verified.
export const authGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const loginRedirect = () =>
    router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });

  if (auth.sessionCheckComplete()) {
    return auth.isAuthenticated() ? true : loginRedirect();
  }

  return auth.sessionCheckComplete$.pipe(
    map(() => auth.isAuthenticated() ? true : loginRedirect())
  );
};
