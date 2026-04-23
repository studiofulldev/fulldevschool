import { APP_INITIALIZER, ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { SupabaseService } from './services/supabase.service';
import { EVENT_TRACKING_PROVIDER } from './services/event-tracking.provider';
import { SupabaseEventTrackingProvider } from './services/supabase-event-tracking.provider';

// Awaits the initial Supabase session check before Angular starts routing.
// Without this, guards run before INITIAL_SESSION fires — they each call
// getSession() independently, blocking route activation and showing a blank
// page until Supabase resolves. With APP_INITIALIZER, sessionCheckComplete
// is true by the time any guard runs, so they all take the fast path.
//
// The 3 s timeout guards against GoTrue being unreachable (e.g., Docker still
// starting). AuthService has its own 5 s safety-net fallback; this initializer
// just prevents the app from blocking the router indefinitely.
function initAuth(): () => Promise<void> {
  const supabase = inject(SupabaseService);
  inject(AuthService); // ensure AuthService registers onAuthStateChange before getSession resolves
  return async () => {
    if (!supabase.isConfigured) return;
    const timeout = new Promise<void>(resolve => setTimeout(resolve, 3000));
    try {
      await Promise.race([supabase.getSession(), timeout]);
    } catch {
      // Supabase unavailable — let the app load anyway; guards will redirect to /login.
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideHttpClient(),
    provideRouter(routes),
    { provide: EVENT_TRACKING_PROVIDER, useClass: SupabaseEventTrackingProvider },
    { provide: APP_INITIALIZER, useFactory: initAuth, multi: true },
  ]
};
