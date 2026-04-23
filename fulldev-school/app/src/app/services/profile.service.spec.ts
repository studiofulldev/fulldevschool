import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { ProfileService } from './profile.service';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { MentorPointsService } from './mentor-points.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = { id: 'user-uuid-123', email: 'test@example.com', name: 'Test' };
const GITHUB_USERNAME = 'chfranca';
const GITHUB_IDENTITY = {
  provider: 'github',
  identity_data: { user_name: GITHUB_USERNAME },
};
const LINKEDIN_IDENTITY = { provider: 'linkedin_oidc', identity_data: {} };

function makeAuthMock(user: typeof MOCK_USER | null = MOCK_USER) {
  const userSig = signal<typeof MOCK_USER | null>(user);
  const completeSig = signal(true);
  return {
    user: userSig,
    sessionCheckComplete: completeSig,
    // Expose signal setters so tests can simulate sign-in/sign-out.
    _setUser: (v: typeof MOCK_USER | null) => userSig.set(v),
    _setComplete: (v: boolean) => completeSig.set(v),
  };
}

function makeSupabaseMock(overrides: {
  profileData?: Record<string, unknown> | null;
  profileError?: unknown;
  identities?: unknown[];
} = {}) {
  const profileData = 'profileData' in overrides ? overrides.profileData : { github_username: GITHUB_USERNAME, linkedin_url: null, instagram_url: null, youtube_url: null };
  const identities = overrides.identities ?? [];
  const profileError = overrides.profileError ?? null;

  const fromMock = {
    error: null as unknown,  // explicit: await fromMock → { error: null } for update().eq() chain
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profileData, error: profileError }),
    update: vi.fn().mockReturnThis(),
  };

  return {
    isConfigured: true,
    client: { from: vi.fn().mockReturnValue(fromMock) },
    getUser: vi.fn().mockResolvedValue({
      data: { user: { identities } },
      error: null,
    }),
    _fromMock: fromMock,
  };
}

function makeMentorPointsMock() {
  return { loadPoints: vi.fn().mockResolvedValue(undefined) };
}

function setup(opts: {
  profileData?: Record<string, unknown> | null;
  profileError?: unknown;
  identities?: unknown[];
  user?: typeof MOCK_USER | null;
} = {}) {
  const authMock = makeAuthMock('user' in opts ? opts.user! : MOCK_USER);
  const supabaseMock = makeSupabaseMock({
    profileData: opts.profileData,
    profileError: opts.profileError,
    identities: opts.identities,
  });
  const mpMock = makeMentorPointsMock();

  TestBed.configureTestingModule({
    providers: [
      ProfileService,
      { provide: AuthService, useValue: authMock },
      { provide: SupabaseService, useValue: supabaseMock },
      { provide: MentorPointsService, useValue: mpMock },
    ],
  });

  return {
    service: TestBed.inject(ProfileService),
    authMock,
    supabaseMock,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfileService — loadSocialLinks', () => {
  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('GitHub username — fonte: banco de dados', () => {
    it('define githubUsername com o valor do banco quando github_username está preenchido', async () => {
      const { service } = setup({ profileData: { github_username: GITHUB_USERNAME, linkedin_url: null, instagram_url: null, youtube_url: null } });
      await service.loadSocialLinks();
      expect(service.githubUsername()).toBe(GITHUB_USERNAME);
    });

    it('strips prefixo de URL do github_username se salvo como URL completa', async () => {
      const { service } = setup({ profileData: { github_username: `https://github.com/${GITHUB_USERNAME}`, linkedin_url: null, instagram_url: null, youtube_url: null } });
      await service.loadSocialLinks();
      expect(service.githubUsername()).toBe(GITHUB_USERNAME);
    });

    it('githubUsername é null quando banco retorna github_username nulo e não há identidade', async () => {
      const { service } = setup({
        profileData: { github_username: null, linkedin_url: null, instagram_url: null, youtube_url: null },
        identities: [],
      });
      await service.loadSocialLinks();
      expect(service.githubUsername()).toBeNull();
    });
  });

  describe('GitHub username — fallback: identidade OAuth', () => {
    it('usa user_name da identidade GitHub quando banco não tem github_username', async () => {
      const { service } = setup({
        profileData: { github_username: null, linkedin_url: null, instagram_url: null, youtube_url: null },
        identities: [GITHUB_IDENTITY],
      });
      await service.loadSocialLinks();
      expect(service.githubUsername()).toBe(GITHUB_USERNAME);
    });

    it('salva username no banco quando obtido da identidade (race condition safety)', async () => {
      const { service, supabaseMock } = setup({
        profileData: { github_username: null, linkedin_url: null, instagram_url: null, youtube_url: null },
        identities: [GITHUB_IDENTITY],
      });
      await service.loadSocialLinks();
      expect(supabaseMock.client.from).toHaveBeenCalledWith('profiles');
      expect(supabaseMock._fromMock.update).toHaveBeenCalledWith({ github_username: GITHUB_USERNAME });
    });
  });

  describe('LinkedIn connection', () => {
    it('linkedinConnected é true quando identidade linkedin_oidc existe', async () => {
      const { service } = setup({ identities: [LINKEDIN_IDENTITY] });
      await service.loadSocialLinks();
      expect(service.linkedinConnected()).toBe(true);
    });

    it('linkedinConnected é false sem identidade LinkedIn', async () => {
      const { service } = setup({ identities: [] });
      await service.loadSocialLinks();
      expect(service.linkedinConnected()).toBe(false);
    });
  });

  describe('Cache — evita re-fetch na navegação', () => {
    it('não chama Supabase novamente em segunda chamada a loadSocialLinks', async () => {
      const { service, supabaseMock } = setup();
      await service.loadSocialLinks();
      await service.loadSocialLinks();
      // client.from é chamado exatamente uma vez (para o SELECT de profiles)
      const profileCalls = (supabaseMock.client.from as ReturnType<typeof vi.fn>).mock.calls.filter(
        (args: unknown[]) => args[0] === 'profiles'
      );
      expect(profileCalls.length).toBe(1);
    });

    it('retorna imediatamente quando usuário não está autenticado', async () => {
      const { service } = setup({ user: null });
      await service.loadSocialLinks();
      // Early return: _loaded stays false and no data is set
      expect((service as unknown as { _loaded: boolean })._loaded).toBe(false);
      expect(service.githubUsername()).toBeNull();
    });
  });

  describe('Proteção contra falha dupla de query', () => {
    it('preserva estado existente quando ambas as queries falham', async () => {
      const { service } = setup({
        profileData: { github_username: GITHUB_USERNAME, linkedin_url: null, instagram_url: null, youtube_url: null },
      });
      // Primeira carga bem-sucedida
      await service.loadSocialLinks();
      expect(service.githubUsername()).toBe(GITHUB_USERNAME);

      // Segunda carga (após reset manual do _loaded) com ambas as queries falhando
      (service as unknown as { _loaded: boolean })._loaded = false;
      const failMock = makeSupabaseMock({ profileError: { message: 'DB error' } });
      (service as unknown as { supabase: unknown })['supabase'] = {
        ...failMock,
        isConfigured: true,
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('auth error') }),
      };
      await service.loadSocialLinks();
      // Estado anterior preservado
      expect(service.githubUsername()).toBe(GITHUB_USERNAME);
    });
  });
});

describe('ProfileService — loadSocialLinks (socialLinks signal)', () => {
  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('carrega linkedin_url, instagram_url e youtube_url do perfil para o signal socialLinks', async () => {
    const { service } = setup({
      profileData: {
        github_username: null,
        linkedin_url: 'https://linkedin.com/in/johndoe',
        instagram_url: 'https://instagram.com/johndoe',
        youtube_url: 'https://youtube.com/@johndoe',
      },
    });
    await service.loadSocialLinks();
    expect(service.socialLinks().linkedin_url).toBe('https://linkedin.com/in/johndoe');
    expect(service.socialLinks().instagram_url).toBe('https://instagram.com/johndoe');
    expect(service.socialLinks().youtube_url).toBe('https://youtube.com/@johndoe');
  });

  it('usa string vazia quando URL do perfil é null', async () => {
    const { service } = setup({
      profileData: { github_username: null, linkedin_url: null, instagram_url: null, youtube_url: null },
    });
    await service.loadSocialLinks();
    expect(service.socialLinks().linkedin_url).toBe('');
    expect(service.socialLinks().instagram_url).toBe('');
    expect(service.socialLinks().youtube_url).toBe('');
  });
});

describe('ProfileService — saveSocialLinks', () => {
  const VALID_LINKS = {
    linkedin_url: 'https://linkedin.com/in/johndoe',
    instagram_url: 'https://instagram.com/johndoe',
    youtube_url: 'https://youtube.com/@johndoe',
  };

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('chama supabase update com os campos corretos', async () => {
    const { service, supabaseMock } = setup();
    await service.saveSocialLinks(VALID_LINKS);
    expect(supabaseMock.client.from).toHaveBeenCalledWith('profiles');
    expect(supabaseMock._fromMock.update).toHaveBeenCalledWith({
      linkedin_url: 'https://linkedin.com/in/johndoe',
      instagram_url: 'https://instagram.com/johndoe',
      youtube_url: 'https://youtube.com/@johndoe',
    });
  });

  it('salva campos vazios como null no banco', async () => {
    const { service, supabaseMock } = setup();
    await service.saveSocialLinks({ linkedin_url: '', instagram_url: '', youtube_url: '' });
    expect(supabaseMock._fromMock.update).toHaveBeenCalledWith({
      linkedin_url: null,
      instagram_url: null,
      youtube_url: null,
    });
  });

  it('saveSuccess fica true após save bem-sucedido', async () => {
    const { service } = setup();
    await service.saveSocialLinks(VALID_LINKS);
    expect(service.saveSuccess()).toBe(true);
  });

  it('atualiza socialLinks signal com os novos valores após save', async () => {
    const { service } = setup();
    await service.saveSocialLinks(VALID_LINKS);
    expect(service.socialLinks().linkedin_url).toBe('https://linkedin.com/in/johndoe');
    expect(service.socialLinks().instagram_url).toBe('https://instagram.com/johndoe');
    expect(service.socialLinks().youtube_url).toBe('https://youtube.com/@johndoe');
  });

  it('define saveError para URL LinkedIn inválida sem chamar supabase', async () => {
    const { service, supabaseMock } = setup();
    await service.saveSocialLinks({
      linkedin_url: 'https://linkedin.com.evil.com/in/foo',
      instagram_url: '',
      youtube_url: '',
    });
    expect(service.saveError()).toBeTruthy();
    expect(supabaseMock._fromMock.update).not.toHaveBeenCalled();
  });

  it('define saveError para URL Instagram inválida sem chamar supabase', async () => {
    const { service, supabaseMock } = setup();
    await service.saveSocialLinks({
      linkedin_url: '',
      instagram_url: 'https://notinstagram.com/foo',
      youtube_url: '',
    });
    expect(service.saveError()).toBeTruthy();
    expect(supabaseMock._fromMock.update).not.toHaveBeenCalled();
  });

  it('define saveError para URL YouTube inválida sem chamar supabase', async () => {
    const { service, supabaseMock } = setup();
    await service.saveSocialLinks({
      linkedin_url: '',
      instagram_url: '',
      youtube_url: 'https://notyoutube.com/@foo',
    });
    expect(service.saveError()).toBeTruthy();
    expect(supabaseMock._fromMock.update).not.toHaveBeenCalled();
  });

  it('define saveError quando supabase retorna erro', async () => {
    const { service, supabaseMock } = setup();
    supabaseMock._fromMock.eq = vi.fn().mockResolvedValue({ error: { message: 'DB error' } });
    await service.saveSocialLinks(VALID_LINKS);
    expect(service.saveError()).toBeTruthy();
    expect(service.saveSuccess()).toBe(false);
  });

  it('retorna imediatamente quando usuário não está autenticado', async () => {
    const { service, supabaseMock } = setup({ user: null });
    await service.saveSocialLinks(VALID_LINKS);
    expect(supabaseMock._fromMock.update).not.toHaveBeenCalled();
  });
});

describe('ProfileService — sign-out reset', () => {
  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('reseta githubUsername para null ao fazer sign-out', async () => {
    const { service, authMock } = setup({
      profileData: { github_username: GITHUB_USERNAME, linkedin_url: null, instagram_url: null, youtube_url: null },
    });
    await service.loadSocialLinks();
    expect(service.githubUsername()).toBe(GITHUB_USERNAME);

    // Simula sign-out: user volta a null com sessionCheckComplete true
    authMock._setUser(null);
    authMock._setComplete(true);

    TestBed.flushEffects();
    expect(service.githubUsername()).toBeNull();
  });

  it('reseta linkedinConnected para false ao fazer sign-out', async () => {
    const { service, authMock } = setup({ identities: [LINKEDIN_IDENTITY] });
    await service.loadSocialLinks();
    expect(service.linkedinConnected()).toBe(true);

    authMock._setUser(null);
    authMock._setComplete(true);

    TestBed.flushEffects();
    expect(service.linkedinConnected()).toBe(false);
  });

  it('permite re-fetch após sign-out e novo login', async () => {
    const { service, authMock } = setup();
    await service.loadSocialLinks();

    // Sign-out
    authMock._setUser(null);

    TestBed.flushEffects();
    // _loaded deve ter sido resetado
    expect((service as unknown as { _loaded: boolean })._loaded).toBe(false);
  });
});
