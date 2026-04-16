import { Injectable, inject } from '@angular/core';
import { EventTrackingProvider } from './event-tracking.provider';
import { SupabaseService } from './supabase.service';

@Injectable()
export class SupabaseEventTrackingProvider implements EventTrackingProvider {
  private readonly supabase = inject(SupabaseService);

  // Supabase não precisa de identificação explícita: o user_id
  // já é persistido como coluna na tabela de eventos.
  identify(_userId: string, _traits: Record<string, unknown>): void {}

  capture(eventName: string, properties: Record<string, unknown>): void {
    const userId = properties['user_id'] as string | undefined;

    // Fire-and-forget — erros de tracking nunca devem afetar o usuário.
    this.supabase.client
      ?.from('events')
      .insert({ user_id: userId ?? null, event_name: eventName, properties })
      .then(({ error }) => {
        if (error) {
          console.warn('[tracking] falha ao registrar evento:', eventName, error.message);
        }
      });
  }

  // Sem estado local a limpar nesta implementação.
  reset(): void {}
}
