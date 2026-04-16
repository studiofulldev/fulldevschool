import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

export const guestOnlyGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Await the session once if the initial check has not yet completed.
  if (!auth.sessionCheckComplete()) {
    await supabase.getSession();
  }

  if (!auth.isAuthenticated()) {
    return true;
  }

  return auth.requiresProfileCompletion(auth.user())
    ? router.createUrlTree(['/complete-profile'])
    : router.createUrlTree(['/courses/home']);
};
