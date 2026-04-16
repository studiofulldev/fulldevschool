import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AppRole, AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

function resolveAllowedRoles(route: ActivatedRouteSnapshot): AppRole[] {
  const roles = route.data['roles'];
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter((role): role is AppRole => role === 'admin' || role === 'instructor' || role === 'user');
}

export const roleGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  const allowedRoles = resolveAllowedRoles(route);

  // Await the session once if the initial check has not yet completed.
  if (!auth.sessionCheckComplete()) {
    await supabase.getSession();
  }

  const hasAccess =
    auth.isAuthenticated() && allowedRoles.length > 0 && auth.hasRole(allowedRoles);

  return hasAccess ? true : router.createUrlTree(['/login']);
};
