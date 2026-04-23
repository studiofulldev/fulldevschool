import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PrCoordinates {
  owner: string;
  repo: string;
  prNumber: number;
}

export interface PrSubmitter {
  full_name: string | null;
  avatar_url: string | null;
  github_username: string | null;
}

export interface PrSubmission {
  id: string;
  user_id: string;
  github_pr_url: string;
  repo_owner: string;
  repo_name: string;
  pr_number: number;
  pr_title?: string;
  pr_body?: string;
  repo_language?: string;
  pr_state: string;
  review_count: number;
  is_active: boolean;
  created_at: string;
  github_synced_at?: string;
  submitter?: PrSubmitter | null;
}

export function parsePrUrl(url: string): PrCoordinates | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;
    const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/);
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2],
      prNumber: parseInt(match[3], 10),
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class PrSubmissionService {
  private readonly supabase = inject(SupabaseService);

  private readonly _submissions = signal<PrSubmission[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly submissions = this._submissions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  async submitPr(url: string): Promise<void> {
    const coords = parsePrUrl(url);
    if (!coords) {
      this._errorMessage.set('URL inválida. Use o formato: https://github.com/owner/repo/pull/42');
      return;
    }

    this._loading.set(true);
    this._errorMessage.set(null);

    try {
      console.log('[PrSubmissionService] invoking sync-pr-data', url);
      const { data, error } = await this.supabase.invokeFn('sync-pr-data', {
        body: { prUrl: url },
      });
      console.log('[PrSubmissionService] invokeFn result', { data, error });

      if (error) {
        let errorCode: string | undefined;
        try {
          // FunctionsHttpError stores the Response as context — read body to get code
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json() as { error?: string };
            errorCode = body?.error;
          }
        } catch { /* ignore body read errors */ }

        console.log('[PrSubmissionService] error code', errorCode);

        if (errorCode === 'rate_limited') {
          this._errorMessage.set('Limite de requisições do GitHub atingido. Tente novamente em alguns minutos.');
        } else if (errorCode === 'private_or_not_found') {
          this._errorMessage.set('Repositório privado ou PR não encontrado. Certifique-se de que o PR é público.');
        } else if (errorCode === 'github_username_not_set') {
          this._errorMessage.set('Cadastre seu username do GitHub na página de conta antes de enviar um PR.');
        } else if (errorCode === 'not_your_pr') {
          this._errorMessage.set('Você só pode enviar PRs da sua própria conta do GitHub.');
        } else if (errorCode === 'already_submitted') {
          this._errorMessage.set('Este PR já foi enviado para review.');
        } else {
          this._errorMessage.set('Erro ao enviar o PR. Tente novamente.');
        }
        return;
      }

      if (data) {
        await this.loadSubmissions();
      }
    } catch (err) {
      console.error('[PrSubmissionService] submitPr threw', err);
      this._errorMessage.set('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      this._loading.set(false);
      console.log('[PrSubmissionService] finally: loading reset');
    }
  }

  async loadSubmissions(): Promise<void> {
    if (!this.supabase.isConfigured) return;
    const { data, error } = await this.supabase.client!
      .from('pr_submissions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('[PrSubmissionService] loadSubmissions:', error);
      return;
    }
    if (!data) return;

    const userIds = [...new Set(data.map(s => s.user_id as string))];
    const { data: profiles } = await this.supabase.client!
      .from('profiles')
      .select('id, full_name, avatar_url, github_username')
      .in('id', userIds);

    const profileMap = new Map<string, PrSubmitter>(
      (profiles ?? []).map(p => [p.id as string, {
        full_name: p.full_name as string | null,
        avatar_url: p.avatar_url as string | null,
        github_username: p.github_username as string | null,
      }])
    );

    this._submissions.set(
      data.map(s => ({ ...s, submitter: profileMap.get(s.user_id) ?? null } as PrSubmission))
    );
  }

  async syncPr(submissionId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.invokeFn('sync-pr-data', {
        body: { submissionId },
      });
      if (error || !data) return;
      this._submissions.update(list =>
        list.map(s => (s.id === submissionId ? { ...s, ...(data as Partial<PrSubmission>) } : s))
      );
    } catch {
      // sync is best-effort
    }
  }
}
