import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

export const profileCompletionGuard: CanActivateFn = async (_, state) => {
  const auth = inject(AuthService);
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Await the session once if the initial check has not yet completed.
  // supabase.getSession() awaits initializePromise internally, so any
  // OAuth hash or stored session is processed before we decide.
  if (!auth.sessionCheckComplete()) {
    await supabase.getSession();
  }

  return auth.isAuthenticated() && auth.requiresProfileCompletion(auth.user())
    ? router.createUrlTree(['/complete-profile'], {
        queryParams: { returnUrl: state.url }
      })
    : true;
};
