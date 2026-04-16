import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { EVENT_TRACKING_PROVIDER } from './event-tracking.provider';

const mockTrackingProvider = { identify: vi.fn(), capture: vi.fn(), reset: vi.fn() };

// Minimal SupabaseService mock — only the methods AuthService calls
function makeSupabaseMock() {
  return {
    isConfigured: true,
    configError: null,
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    signInWithPassword: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUpWithPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue({}),
    upsertProfile: vi.fn().mockResolvedValue({}),
    toUserMetadata: vi.fn().mockReturnValue({
      fullName: '',
      whatsappNumber: '',
      technicalLevel: null,
      educationInstitution: '',
      acceptedTerms: false,
      acceptedTermsAt: '',
      age: null
    })
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let supabaseMock: ReturnType<typeof makeSupabaseMock>;

  beforeEach(() => {
    localStorage.clear();
    supabaseMock = makeSupabaseMock();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: EVENT_TRACKING_PROVIDER, useValue: mockTrackingProvider }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // -------------------------------------------------------------------------
  // signInWithEmail — error handling
  // -------------------------------------------------------------------------

  describe('signInWithEmail error normalization', () => {
    it('returns friendly message for invalid credentials', async () => {
      supabaseMock.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });
      const result = await service.signInWithEmail('a@b.com', 'wrong');
      expect(result.ok).toBe(false);
      expect(result.message).toBe('E-mail ou senha invalidos.');
    });

    it('returns friendly message when email is not confirmed', async () => {
      supabaseMock.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' }
      });
      const result = await service.signInWithEmail('a@b.com', 'pass');
      expect(result.ok).toBe(false);
      expect(result.message).toBe('Confirme seu e-mail antes de entrar.');
    });

    it('passes through unknown Supabase errors as-is', async () => {
      supabaseMock.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Too many requests' }
      });
      const result = await service.signInWithEmail('a@b.com', 'pass');
      expect(result.ok).toBe(false);
      expect(result.message).toBe('Too many requests');
    });

    it('returns ok:false when Supabase returns no user and no error', async () => {
      supabaseMock.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: null
      });
      const result = await service.signInWithEmail('a@b.com', 'pass');
      expect(result.ok).toBe(false);
    });

    it('returns ok:false when Supabase throws an unexpected exception', async () => {
      supabaseMock.signInWithPassword.mockRejectedValue(new Error('network error'));
      const result = await service.signInWithEmail('a@b.com', 'pass');
      expect(result.ok).toBe(false);
    });

    it('normalizes the email to lowercase before calling Supabase', async () => {
      supabaseMock.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });
      await service.signInWithEmail('User@Example.COM', 'pass');
      expect(supabaseMock.signInWithPassword).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(String)
      );
    });

    it.todo('does not trim spaces from the password (PR #5 — security/fix-password-trim)');
  });

  // -------------------------------------------------------------------------
  // registerWithEmail — validation
  // -------------------------------------------------------------------------

  describe('registerWithEmail validation', () => {
    const validPayload = {
      name: 'Ana Lima',
      email: 'ana@example.com',
      password: 'senha123',
      technicalLevel: 'junior' as const,
      age: 22,
      acceptedTerms: true
    };

    it('returns error when acceptedTerms is false', async () => {
      const result = await service.registerWithEmail({
        ...validPayload,
        acceptedTerms: false
      });
      expect(result.ok).toBe(false);
      expect(result.message).toContain('termos');
    });

    it('returns error when name is empty', async () => {
      const result = await service.registerWithEmail({ ...validPayload, name: '  ' });
      expect(result.ok).toBe(false);
    });

    it('returns error when email is empty', async () => {
      const result = await service.registerWithEmail({ ...validPayload, email: '' });
      expect(result.ok).toBe(false);
    });

    it('returns error when password is empty', async () => {
      const result = await service.registerWithEmail({ ...validPayload, password: '' });
      expect(result.ok).toBe(false);
    });

    it('returns error when age is null', async () => {
      const result = await service.registerWithEmail({ ...validPayload, age: null });
      expect(result.ok).toBe(false);
    });

    it('returns friendly message for already-registered email', async () => {
      supabaseMock.signUpWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      });
      const result = await service.registerWithEmail(validPayload);
      expect(result.ok).toBe(false);
      expect(result.message).toBe('Ja existe uma conta com este e-mail.');
    });

    it.todo('does not trim spaces from the password (PR #5 — security/fix-password-trim)');
  });

  // -------------------------------------------------------------------------
  // signOut
  // -------------------------------------------------------------------------

  describe('signOut', () => {
    it('calls supabase.signOut()', async () => {
      await service.signOut();
      expect(supabaseMock.signOut).toHaveBeenCalledOnce();
    });

    it('clears the localStorage cache on sign-out', async () => {
      localStorage.setItem('fulldev-school.auth.user', JSON.stringify({ id: '1' }));
      await service.signOut();
      expect(localStorage.getItem('fulldev-school.auth.user')).toBeNull();
    });

    it('completes sign-out even when supabase.signOut() throws', async () => {
      supabaseMock.signOut.mockRejectedValue(new Error('network'));
      await expect(service.signOut()).resolves.not.toThrow();
      expect(localStorage.getItem('fulldev-school.auth.user')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Security: session trust (requires PR #4 — security/fix-session-trust)
  // -------------------------------------------------------------------------

  describe('session trust', () => {
    it.todo('isAuthenticated is false on startup even when localStorage has a cached user (PR #4)');
    it.todo('isAuthenticated becomes true only after Supabase confirms the session (PR #4)');
    it.todo('sessionCheckComplete emits once after the initial session check (PR #4)');
  });

  // -------------------------------------------------------------------------
  // Security: avatar URL sanitization (requires PR #6 — security/sanitize-avatar-url)
  // -------------------------------------------------------------------------

  describe('sanitizeAvatarUrl', () => {
    it.todo('accepts Google CDN avatar URLs (lh3.googleusercontent.com) (PR #6)');
    it.todo('accepts Supabase storage URLs (*.supabase.co) (PR #6)');
    it.todo('rejects URLs from unknown domains (PR #6)');
    it.todo('rejects non-HTTPS URLs (PR #6)');
    it.todo('rejects javascript: URLs (PR #6)');
    it.todo('rejects data: URIs (PR #6)');
    it.todo('returns null for non-string values (PR #6)');
  });
});
