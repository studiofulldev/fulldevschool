import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { resolveLevel, resolveNextThreshold, MentorPointsService } from './mentor-points.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

describe('resolveLevel', () => {
  describe('boundaries exatos (off-by-one críticos)', () => {
    it('0 pontos → dev_em_formacao', () => expect(resolveLevel(0)).toBe('dev_em_formacao'));
    it('49 pontos → dev_em_formacao', () => expect(resolveLevel(49)).toBe('dev_em_formacao'));
    it('50 pontos → code_reviewer', () => expect(resolveLevel(50)).toBe('code_reviewer'));
    it('149 pontos → code_reviewer', () => expect(resolveLevel(149)).toBe('code_reviewer'));
    it('150 pontos → senior_reviewer', () => expect(resolveLevel(150)).toBe('senior_reviewer'));
    it('349 pontos → senior_reviewer', () => expect(resolveLevel(349)).toBe('senior_reviewer'));
    it('350 pontos → tech_lead', () => expect(resolveLevel(350)).toBe('tech_lead'));
    it('699 pontos → tech_lead', () => expect(resolveLevel(699)).toBe('tech_lead'));
    it('700 pontos → fulldev_fellow', () => expect(resolveLevel(700)).toBe('fulldev_fellow'));
    it('9999 pontos → fulldev_fellow', () => expect(resolveLevel(9999)).toBe('fulldev_fellow'));
  });

  describe('edge case', () => {
    it('pontos negativos → dev_em_formacao (não quebra)', () => {
      expect(resolveLevel(-1)).toBe('dev_em_formacao');
    });
  });
});

describe('resolveNextThreshold', () => {
  it('0 pontos → próximo marco é 50', () => expect(resolveNextThreshold(0)).toBe(50));
  it('49 pontos → próximo marco é 50', () => expect(resolveNextThreshold(49)).toBe(50));
  it('50 pontos → próximo marco é 150', () => expect(resolveNextThreshold(50)).toBe(150));
  it('150 pontos → próximo marco é 350', () => expect(resolveNextThreshold(150)).toBe(350));
  it('350 pontos → próximo marco é 700', () => expect(resolveNextThreshold(350)).toBe(700));
  it('700 pontos → null (nível máximo, sem próximo)', () => expect(resolveNextThreshold(700)).toBeNull());
  it('9999 pontos → null (nível máximo)', () => expect(resolveNextThreshold(9999)).toBeNull());
});

// ---------------------------------------------------------------------------
// MentorPointsService — loadPoints (integration with TestBed)
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-uuid-123' };

function setup(opts: { mentorPoints?: number | null; user?: unknown } = {}) {
  const authUser = 'user' in opts ? opts.user : MOCK_USER;
  const authMock = { user: signal(authUser) };

  const fromMock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: opts.mentorPoints != null ? { mentor_points: opts.mentorPoints } : null,
      error: null,
    }),
  };
  const supabaseMock = {
    isConfigured: true,
    client: { from: vi.fn().mockReturnValue(fromMock) },
  };

  TestBed.configureTestingModule({
    providers: [
      MentorPointsService,
      { provide: AuthService, useValue: authMock },
      { provide: SupabaseService, useValue: supabaseMock },
    ],
  });

  return { service: TestBed.inject(MentorPointsService), supabaseMock };
}

describe('MentorPointsService — loadPoints', () => {
  afterEach(() => { vi.clearAllMocks(); TestBed.resetTestingModule(); });

  it('carrega mentor_points do perfil e atualiza o signal points', async () => {
    const { service } = setup({ mentorPoints: 75 });
    await service.loadPoints();
    expect(service.points()).toBe(75);
  });

  it('não altera points quando data é null (usuário sem pontos ainda)', async () => {
    const { service } = setup({ mentorPoints: null });
    await service.loadPoints();
    expect(service.points()).toBe(0);
  });

  it('retorna imediatamente quando usuário não está autenticado', async () => {
    const { service, supabaseMock } = setup({ user: null });
    await service.loadPoints();
    expect(supabaseMock.client.from).not.toHaveBeenCalled();
  });

});
