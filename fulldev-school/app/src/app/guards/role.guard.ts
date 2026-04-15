import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AppRole, AuthService } from '../services/auth.service';

function resolveAllowedRoles(route: ActivatedRouteSnapshot): AppRole[] {
  const roles = route.data['roles'];
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter((role): role is AppRole => role === 'admin' || role === 'instructor' || role === 'user');
}

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = resolveAllowedRoles(route);
  const loginRedirect = () => router.createUrlTree(['/login']);

  const hasAccess = () =>
    auth.isAuthenticated() &&
    allowedRoles.length > 0 &&
    auth.hasRole(allowedRoles);

  if (auth.sessionCheckComplete()) {
    return hasAccess() ? true : loginRedirect();
  }

  return auth.sessionCheckComplete$.pipe(
    map(() => (hasAccess() ? true : loginRedirect()))
  );
};
