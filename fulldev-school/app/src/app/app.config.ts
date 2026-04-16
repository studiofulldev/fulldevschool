import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { EVENT_TRACKING_PROVIDER } from './services/event-tracking.provider';
import { SupabaseEventTrackingProvider } from './services/supabase-event-tracking.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideHttpClient(),
    provideRouter(routes),
    { provide: EVENT_TRACKING_PROVIDER, useClass: SupabaseEventTrackingProvider }
  ]
};
