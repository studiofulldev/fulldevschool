import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PrCoordinates {
  owner: string;
  repo: string;
  prNumber: number;
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
      const { data, error } = await this.supabase.invokeFn('sync-pr-data', {
        body: { prUrl: url },
      });

      if (error) {
        this._errorMessage.set('Erro ao enviar o PR. Tente novamente.');
        return;
      }

      if (data?.error === 'private_or_not_found') {
        this._errorMessage.set(
          'Repositório privado ou PR não encontrado. Certifique-se de que o PR é público.'
        );
        return;
      }

      if (data) {
        this._submissions.update(list => [data as PrSubmission, ...list]);
      }
    } catch {
      this._errorMessage.set('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      this._loading.set(false);
    }
  }

  async loadSubmissions(): Promise<void> {
    if (!this.supabase.isConfigured) return;
    const { data } = await this.supabase.client!
      .from('pr_submissions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) this._submissions.set(data as PrSubmission[]);
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
