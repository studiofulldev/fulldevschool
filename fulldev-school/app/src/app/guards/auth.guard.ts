import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

// getSession() internally awaits Supabase's initializePromise, which processes
// any OAuth callback (implicit grant hash or PKCE code exchange) before returning.
// This guarantees the guard never decides before auth state is fully resolved.
export const authGuard: CanActivateFn = async (_, state) => {
  const auth = inject(AuthService);
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const loginRedirect = () =>
    router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });

  // Fast path: session already verified in this app lifetime.
  if (auth.sessionCheckComplete()) {
    return auth.isAuthenticated() ? true : loginRedirect();
  }

  // Slow path: wait for Supabase to resolve the current session
  // (reads localStorage, exchanges PKCE code, validates token — whatever applies).
  try {
    const { data, error } = await supabase.getSession();
    if (error || !data?.session?.user) {
      return loginRedirect();
    }
    return true;
  } catch {
    return loginRedirect();
  }
};
