import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const guestOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const resolveAccess = () => {
    if (!auth.isAuthenticated()) {
      return true;
    }

    return auth.requiresProfileCompletion(auth.user())
      ? router.createUrlTree(['/complete-profile'])
      : router.createUrlTree(['/courses/home']);
  };

  if (auth.sessionCheckComplete()) {
    return resolveAccess();
  }

  return auth.sessionCheckComplete$.pipe(map(() => resolveAccess()));
};
