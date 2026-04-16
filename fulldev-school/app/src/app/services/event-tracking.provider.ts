import { InjectionToken } from '@angular/core';

/**
 * Interface de provider de tracking de eventos.
 *
 * Implementações atuais: SupabaseEventTrackingProvider (armazena no banco).
 * Para migrar para PostHog (ou outro serviço), basta criar uma nova
 * implementação e trocar o token em app.config.ts.
 */
export interface EventTrackingProvider {
  /**
   * Associa as próximas capturas a um usuário identificado.
   * Provedores que não precisam de identificação explícita (ex.: Supabase,
   * onde user_id já vem na linha) devem implementar como no-op.
   */
  identify(userId: string, traits: Record<string, unknown>): void;

  /** Registra um evento com propriedades arbitrárias. */
  capture(eventName: string, properties: Record<string, unknown>): void;

  /** Limpa o estado de identificação (ex.: ao fazer logout). */
  reset(): void;
}

export const EVENT_TRACKING_PROVIDER =
  new InjectionToken<EventTrackingProvider>('EventTrackingProvider');
