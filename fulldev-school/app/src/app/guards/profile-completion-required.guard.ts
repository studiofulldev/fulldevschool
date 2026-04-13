import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const profileCompletionRequiredGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const resolveAccess = () =>
    auth.isAuthenticated() && auth.requiresProfileCompletion(auth.user())
      ? true
      : router.createUrlTree(['/courses/home']);

  if (auth.sessionCheckComplete()) {
    return resolveAccess();
  }

  return auth.sessionCheckComplete$.pipe(map(() => resolveAccess()));
};
