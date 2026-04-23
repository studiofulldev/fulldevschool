import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrSubmissionService, parsePrUrl } from './pr-submission.service';
import { SupabaseService } from './supabase.service';

function makeSupabaseMock() {
  return {
    isConfigured: true,
    configError: null,
    invokeFn: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

// Simulates the FunctionsHttpError structure Supabase JS returns for 4xx/5xx responses.
// The service reads error codes via error.context.json().
function makeHttpError(code: string) {
  return {
    message: 'FunctionsHttpError',
    context: { json: vi.fn().mockResolvedValue({ error: code }) },
  };
}

describe('parsePrUrl', () => {
  describe('happy path — URLs válidas', () => {
    it('extrai owner, repo e prNumber de URL padrão', () => {
      const result = parsePrUrl('https://github.com/fulldev/school/pull/42');
      expect(result).toEqual({ owner: 'fulldev', repo: 'school', prNumber: 42 });
    });

    it('extrai corretamente com trailing slash', () => {
      const result = parsePrUrl('https://github.com/fulldev/school/pull/42/');
      expect(result).toEqual({ owner: 'fulldev', repo: 'school', prNumber: 42 });
    });

    it('ignora query string', () => {
      const result = parsePrUrl('https://github.com/fulldev/school/pull/42?diff=unified');
      expect(result).toEqual({ owner: 'fulldev', repo: 'school', prNumber: 42 });
    });
  });

  describe('edge cases — retorna null', () => {
    it('retorna null para URL de issue (não PR)', () => {
      expect(parsePrUrl('https://github.com/fulldev/school/issues/42')).toBeNull();
    });

    it('retorna null para URL do GitLab', () => {
      expect(parsePrUrl('https://gitlab.com/fulldev/school/merge_requests/42')).toBeNull();
    });

    it('retorna null quando prNumber não é número', () => {
      expect(parsePrUrl('https://github.com/fulldev/school/pull/abc')).toBeNull();
    });

    it('retorna null para URL sem protocolo', () => {
      expect(parsePrUrl('github.com/fulldev/school/pull/42')).toBeNull();
    });

    it('retorna null para string vazia', () => {
      expect(parsePrUrl('')).toBeNull();
    });

    it('retorna null para URL sem owner/repo', () => {
      expect(parsePrUrl('https://github.com/pull/42')).toBeNull();
    });
  });
});

describe('PrSubmissionService', () => {
  let service: PrSubmissionService;
  let supabaseMock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    supabaseMock = makeSupabaseMock();
    TestBed.configureTestingModule({
      providers: [
        PrSubmissionService,
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    });
    service = TestBed.inject(PrSubmissionService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('submitPr', () => {
    const validUrl = 'https://github.com/fulldev/school/pull/42';
    const mockSubmission = { id: 'uuid-1', github_pr_url: validUrl, pr_state: 'open', review_count: 0 };

    it('chama invokeFn com a URL correta para PR válido', async () => {
      supabaseMock.invokeFn.mockResolvedValue({ data: mockSubmission, error: null });
      await service.submitPr(validUrl);
      expect(supabaseMock.invokeFn).toHaveBeenCalledWith('sync-pr-data', { body: { prUrl: validUrl } });
    });

    it('adiciona o item retornado ao signal submissions', async () => {
      supabaseMock.invokeFn.mockResolvedValue({ data: mockSubmission, error: null });
      await service.submitPr(validUrl);
      expect(service.submissions()).toContain(mockSubmission);
    });

    it('define loading como true durante o invoke e false após resolver', async () => {
      let loadingDuringInvoke = false;
      supabaseMock.invokeFn.mockImplementation(async () => {
        loadingDuringInvoke = service.loading();
        return { data: mockSubmission, error: null };
      });
      await service.submitPr(validUrl);
      expect(loadingDuringInvoke).toBe(true);
      expect(service.loading()).toBe(false);
    });

    it('não chama invokeFn para URL inválida', async () => {
      await service.submitPr('https://notgithub.com/foo/bar');
      expect(supabaseMock.invokeFn).not.toHaveBeenCalled();
    });

    it('define errorMessage amigável para URL inválida', async () => {
      await service.submitPr('https://notgithub.com/foo/bar');
      const msg = service.errorMessage();
      expect(msg).toBeTruthy();
      expect(msg!.length).toBeGreaterThan(10); // mensagem legível, não código de erro
    });

    it('define loading como false após erro de rede', async () => {
      supabaseMock.invokeFn.mockRejectedValue(new Error('Network error'));
      await service.submitPr(validUrl);
      expect(service.loading()).toBe(false);
    });

    it('define errorMessage amigável para erro de rede', async () => {
      supabaseMock.invokeFn.mockRejectedValue(new Error('Network error'));
      await service.submitPr(validUrl);
      expect(service.errorMessage()).toBeTruthy();
    });

    it('define errorMessage específica para repositório privado', async () => {
      supabaseMock.invokeFn.mockResolvedValue({ data: null, error: makeHttpError('private_or_not_found') });
      await service.submitPr(validUrl);
      const msg = service.errorMessage();
      expect(msg).toBeTruthy();
      expect(msg!.toLowerCase()).toContain('privado');
    });

    it('não altera submissions para repositório privado', async () => {
      supabaseMock.invokeFn.mockResolvedValue({ data: null, error: makeHttpError('private_or_not_found') });
      await service.submitPr(validUrl);
      expect(service.submissions()).toHaveLength(0);
    });

    it('define errorMessage específica para rate limit do GitHub', async () => {
      supabaseMock.invokeFn.mockResolvedValue({ data: null, error: makeHttpError('rate_limited') });
      await service.submitPr(validUrl);
      expect(service.errorMessage()!.toLowerCase()).toContain('minutos');
    });

    it('define errorMessage específica para github_username não cadastrado', async () => {
      supabaseMock.invokeFn.mockResolvedValue({ data: null, error: makeHttpError('github_username_not_set') });
      await service.submitPr(validUrl);
      expect(service.errorMessage()!.toLowerCase()).toContain('username');
    });

    it('define errorMessage específica para PR de outro usuário', async () => {
      supabaseMock.invokeFn.mockResolvedValue({ data: null, error: makeHttpError('not_your_pr') });
      await service.submitPr(validUrl);
      expect(service.errorMessage()!.toLowerCase()).toContain('própria');
    });

    it('define errorMessage específica para PR já enviado', async () => {
      supabaseMock.invokeFn.mockResolvedValue({ data: null, error: makeHttpError('already_submitted') });
      await service.submitPr(validUrl);
      expect(service.errorMessage()!.toLowerCase()).toContain('já');
    });

    it('limpa errorMessage anterior ao submeter novamente com sucesso', async () => {
      supabaseMock.invokeFn.mockResolvedValueOnce({ data: null, error: makeHttpError('rate_limited') });
      await service.submitPr(validUrl);
      expect(service.errorMessage()).toBeTruthy();

      supabaseMock.invokeFn.mockResolvedValueOnce({ data: mockSubmission, error: null });
      await service.submitPr(validUrl);
      expect(service.errorMessage()).toBeNull();
    });
  });

  describe('syncPr', () => {
    it('chama invokeFn com o submissionId correto', async () => {
      supabaseMock.invokeFn.mockResolvedValue({ data: null, error: null });
      await service.syncPr('uuid-1');
      expect(supabaseMock.invokeFn).toHaveBeenCalledWith('sync-pr-data', { body: { submissionId: 'uuid-1' } });
    });

    it('atualiza o item correspondente no signal sem duplicar', async () => {
      const existing = { id: 'uuid-1', github_pr_url: 'https://github.com/a/b/pull/1', pr_state: 'open', review_count: 0 } as any;
      const updated = { ...existing, review_count: 3, pr_state: 'closed' };
      supabaseMock.invokeFn.mockResolvedValue({ data: updated, error: null });

      // Pre-populate signal via submit path
      supabaseMock.invokeFn.mockResolvedValueOnce({ data: existing, error: null });
      await service.submitPr('https://github.com/a/b/pull/1');

      supabaseMock.invokeFn.mockResolvedValueOnce({ data: updated, error: null });
      await service.syncPr('uuid-1');

      expect(service.submissions()).toHaveLength(1);
      expect(service.submissions()[0].review_count).toBe(3);
    });

    it('não altera submissions quando syncPr retorna erro', async () => {
      const existing = { id: 'uuid-1', github_pr_url: 'https://github.com/a/b/pull/1', pr_state: 'open', review_count: 0 } as any;

      supabaseMock.invokeFn.mockResolvedValueOnce({ data: existing, error: null });
      await service.submitPr('https://github.com/a/b/pull/1');

      supabaseMock.invokeFn.mockResolvedValueOnce({ data: null, error: { message: 'server error' } });
      await service.syncPr('uuid-1');

      expect(service.submissions()).toHaveLength(1);
      expect(service.submissions()[0].review_count).toBe(0);
    });
  });
});
