import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

// Centralizes error/warn logging so that:
// - Dev: logs appear in the browser console for debugging.
// - Prod: logs are silenced — no internal details leak to the DevTools.
//
// When an error tracking service (e.g. Sentry) is added, wire it here.

@Injectable({ providedIn: 'root' })
export class LoggerService {
  error(context: string, message: string, detail?: unknown): void {
    if (!environment.production) {
      console.error(`[${context}] ${message}`, detail ?? '');
    }
    // TODO: forward to Sentry or equivalent in production
  }

  warn(context: string, message: string, detail?: unknown): void {
    if (!environment.production) {
      console.warn(`[${context}] ${message}`, detail ?? '');
    }
  }
}
