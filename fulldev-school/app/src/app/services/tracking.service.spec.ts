import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { TrackingService, LessonTrackingContext } from './tracking.service';
import { AuthService } from './auth.service';
import { CourseProgressService } from './course-progress.service';
import { SupabaseService } from './supabase.service';
import { EVENT_TRACKING_PROVIDER, EventTrackingProvider } from './event-tracking.provider';

// -----------------------------------------------------------------------
// Mock do EventTrackingProvider
// -----------------------------------------------------------------------
// Tipo separado para que vi.fn() não precise satisfazer as assinaturas da interface.
// O cast para EventTrackingProvider é feito apenas no ponto de registro do DI.
interface ProviderMock {
  identify: ReturnType<typeof vi.fn>;
  capture: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
}

function makeProviderMock(): ProviderMock {
  return {
    identify: vi.fn(),
    capture: vi.fn(),
    reset: vi.fn()
  };
}

// -----------------------------------------------------------------------
// Helpers de fixtures
// -----------------------------------------------------------------------
function makeUser(overrides: Partial<{
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'user';
  acceptedTermsAt: string | null;
}> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    provider: 'email' as const,
    acceptedTermsAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

function makeLessonContext(overrides: Partial<LessonTrackingContext> = {}): LessonTrackingContext {
  return {
    lessonId: 'lesson-intro',
    lessonTitle: 'Introdução',
    moduleId: 'section-01',
    courseId: 'start',
    lessonIndex: 0,
    ...overrides
  };
}

function makeAuthMock(userValue: ReturnType<typeof makeUser> | null = null) {
  const userSignal = signal<ReturnType<typeof makeUser> | null>(userValue);
  return {
    user: userSignal,
    sessionCheckComplete$: of(true),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    }),
    isAuthenticated: signal(userValue !== null),
    isAdmin: signal(false),
    isInstructor: signal(false),
    isCommonUser: signal(userValue?.role === 'user'),
    sessionCheckComplete: signal(true),
    requiresProfileCompletion: vi.fn().mockReturnValue(false)
  };
}

function makeSupabaseMock() {
  return {
    isConfigured: true,
    configError: null,
    fetchUserProgress: vi.fn().mockResolvedValue({ data: [], error: null }),
    upsertProgress: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    }),
    toUserMetadata: vi.fn().mockReturnValue({
      fullName: '',
      whatsappNumber: '',
      technicalLevel: null,
      educationInstitution: '',
      acceptedTerms: false,
      acceptedTermsAt: null,
      age: null,
      role: 'user'
    }),
    signOut: vi.fn().mockResolvedValue({})
  };
}

function setupTestBed(
  userValue: ReturnType<typeof makeUser> | null = null,
  provider = makeProviderMock()
) {
  TestBed.configureTestingModule({
    providers: [
      TrackingService,
      { provide: AuthService, useValue: makeAuthMock(userValue) },
      { provide: SupabaseService, useValue: makeSupabaseMock() },
      { provide: EVENT_TRACKING_PROVIDER, useValue: provider as unknown as EventTrackingProvider }
    ]
  });
  return { service: TestBed.inject(TrackingService), provider };
}

// -----------------------------------------------------------------------
// Group 1: Inicialização (T1.1–T1.2)
// -----------------------------------------------------------------------
describe('TrackingService — initialization', () => {
  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('T1.1: generates a unique sessionId (UUID format)', () => {
    const { service } = setupTestBed();
    const sessionId = (service as unknown as { sessionId: string }).sessionId;
    expect(sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('T1.2: starts with firstLessonCompletedThisSession = false', () => {
    const { service } = setupTestBed();
    const flag = (service as unknown as { firstLessonCompletedThisSession: boolean }).firstLessonCompletedThisSession;
    expect(flag).toBe(false);
  });
});

// -----------------------------------------------------------------------
// Group 2: trackSessionStarted (T2.1–T2.6)
// -----------------------------------------------------------------------
describe('TrackingService — trackSessionStarted', () => {
  let service: TrackingService;
  let provider: ReturnType<typeof makeProviderMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    ({ service, provider } = setupTestBed());
  });

  afterEach(() => TestBed.resetTestingModule());

  it('T2.1: calls provider.identify with user id and pseudonymous properties (no PII)', () => {
    const user = makeUser();
    service.trackSessionStarted(user as never, false);

    // email e name são excluídos intencionalmente — enviar PII requer base legal LGPD.
    expect(provider.identify).toHaveBeenCalledWith(user.id, {
      role: user.role,
      technical_level: null
    });
  });

  it('T2.2: captures session_started with required properties', () => {
    const user = makeUser();
    service.trackSessionStarted(user as never, true);

    expect(provider.capture).toHaveBeenCalledWith('session_started', expect.objectContaining({
      user_id: user.id,
      user_role: user.role,
      platform: 'web',
      is_first_session: true
    }));
  });

  it('T2.3: days_since_signup is calculated correctly from acceptedTermsAt', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-16T12:00:00.000Z'));

    const user = makeUser({ acceptedTermsAt: '2026-01-01T12:00:00.000Z' });
    service.trackSessionStarted(user as never, false);

    const props = provider.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(props['days_since_signup']).toBe(105);

    vi.useRealTimers();
  });

  it('T2.4: days_since_signup is -1 when acceptedTermsAt is null', () => {
    const user = makeUser({ acceptedTermsAt: null });
    service.trackSessionStarted(user as never, false);

    const props = provider.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(props['days_since_signup']).toBe(-1);
  });

  it('T2.5: is_first_session is false when passed as false', () => {
    const user = makeUser();
    service.trackSessionStarted(user as never, false);

    const props = provider.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(props['is_first_session']).toBe(false);
  });

  it('T2.6: is_first_session is true when passed as true', () => {
    const user = makeUser();
    service.trackSessionStarted(user as never, true);

    const props = provider.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(props['is_first_session']).toBe(true);
  });
});

// -----------------------------------------------------------------------
// Group 3: trackLessonStarted (T3.1–T3.3)
// -----------------------------------------------------------------------
describe('TrackingService — trackLessonStarted', () => {
  let service: TrackingService;
  let provider: ReturnType<typeof makeProviderMock>;
  const user = makeUser();

  beforeEach(() => {
    vi.clearAllMocks();
    ({ service, provider } = setupTestBed(user));
  });

  afterEach(() => TestBed.resetTestingModule());

  it('T3.1: captures lesson_started with all context fields', () => {
    const ctx = makeLessonContext();
    service.trackLessonStarted(ctx);

    expect(provider.capture).toHaveBeenCalledWith('lesson_started', expect.objectContaining({
      lesson_id: ctx.lessonId,
      lesson_title: ctx.lessonTitle,
      module_id: ctx.moduleId,
      course_id: ctx.courseId,
      lesson_index: ctx.lessonIndex
    }));
  });

  it('T3.2: includes user_id and user_role from AuthService', () => {
    const ctx = makeLessonContext();
    service.trackLessonStarted(ctx);

    expect(provider.capture).toHaveBeenCalledWith('lesson_started', expect.objectContaining({
      user_id: user.id,
      user_role: user.role
    }));
  });

  it('T3.3: includes platform web and session_id (UUID)', () => {
    const ctx = makeLessonContext();
    service.trackLessonStarted(ctx);

    const props = provider.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(props['platform']).toBe('web');
    expect(typeof props['session_id']).toBe('string');
    expect(props['session_id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});

// -----------------------------------------------------------------------
// Group 4: trackLessonCompleted (T4.1–T4.6)
// -----------------------------------------------------------------------
describe('TrackingService — trackLessonCompleted', () => {
  let service: TrackingService;
  let provider: ReturnType<typeof makeProviderMock>;
  const user = makeUser();

  beforeEach(() => {
    vi.clearAllMocks();
    ({ service, provider } = setupTestBed(user));
  });

  afterEach(() => TestBed.resetTestingModule());

  it('T4.1: captures lesson_completed with all context fields', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 120);

    expect(provider.capture).toHaveBeenCalledWith('lesson_completed', expect.objectContaining({
      lesson_id: ctx.lessonId,
      lesson_title: ctx.lessonTitle,
      module_id: ctx.moduleId,
      course_id: ctx.courseId,
      lesson_index: ctx.lessonIndex
    }));
  });

  it('T4.2: includes time_on_lesson in the captured event', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 300);

    const props = provider.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(props['time_on_lesson']).toBe(300);
  });

  it('T4.3: includes user_id and user_role from AuthService', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 60);

    expect(provider.capture).toHaveBeenCalledWith('lesson_completed', expect.objectContaining({
      user_id: user.id,
      user_role: user.role
    }));
  });

  it('T4.4: includes platform and session_id', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 60);

    const props = provider.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(props['platform']).toBe('web');
    expect(typeof props['session_id']).toBe('string');
  });

  it('T4.5: first_lesson_completed is true on the first call', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 60);

    const props = provider.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(props['first_lesson_completed']).toBe(true);
  });

  it('T4.6: first_lesson_completed is false on subsequent calls', () => {
    service.trackLessonCompleted(makeLessonContext({ lessonId: 'l1' }), 60);
    service.trackLessonCompleted(makeLessonContext({ lessonId: 'l2' }), 90);

    const props = provider.capture.mock.calls[1][1] as Record<string, unknown>;
    expect(props['first_lesson_completed']).toBe(false);
  });
});

// -----------------------------------------------------------------------
// Group 5: first_lesson_completed idempotency (T5.1–T5.3)
// -----------------------------------------------------------------------
describe('TrackingService — first_lesson_completed idempotency', () => {
  let service: TrackingService;
  let provider: ReturnType<typeof makeProviderMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    ({ service, provider } = setupTestBed(makeUser()));
  });

  afterEach(() => TestBed.resetTestingModule());

  it('T5.1: always sends first_lesson_completed explicitly (even when false)', () => {
    service.trackLessonCompleted(makeLessonContext({ lessonId: 'l1' }), 30);
    service.trackLessonCompleted(makeLessonContext({ lessonId: 'l2' }), 45);

    const props = provider.capture.mock.calls[1][1] as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(props, 'first_lesson_completed')).toBe(true);
    expect(props['first_lesson_completed']).toBe(false);
  });

  it('T5.2: after resetSession, first_lesson_completed is true again', () => {
    service.trackLessonCompleted(makeLessonContext(), 60);
    service.resetSession();
    vi.clearAllMocks();
    service.trackLessonCompleted(makeLessonContext(), 30);

    const props = provider.capture.mock.calls[0][1] as Record<string, unknown>;
    expect(props['first_lesson_completed']).toBe(true);
  });

  it('T5.3: flag flips to true after first completion and stays true', () => {
    service.trackLessonCompleted(makeLessonContext(), 60);
    const flag = (service as unknown as { firstLessonCompletedThisSession: boolean }).firstLessonCompletedThisSession;
    expect(flag).toBe(true);

    service.trackLessonCompleted(makeLessonContext({ lessonId: 'l2' }), 90);
    const flagAfterSecond = (service as unknown as { firstLessonCompletedThisSession: boolean }).firstLessonCompletedThisSession;
    expect(flagAfterSecond).toBe(true);
  });
});

// -----------------------------------------------------------------------
// Group 6: calculateTimeOnLesson (T6.1–T6.5)
// -----------------------------------------------------------------------
describe('TrackingService — calculateTimeOnLesson', () => {
  let service: TrackingService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    ({ service } = setupTestBed());
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('T6.1: returns 0 if lessonId was never recorded', () => {
    expect(service.calculateTimeOnLesson('unknown-lesson')).toBe(0);
  });

  it('T6.2: returns elapsed seconds after recordLessonStart', () => {
    service.recordLessonStart('lesson-a');
    vi.advanceTimersByTime(5000);
    expect(service.calculateTimeOnLesson('lesson-a')).toBe(5);
  });

  it('T6.3: rounds down to the nearest second', () => {
    service.recordLessonStart('lesson-b');
    vi.advanceTimersByTime(7500);
    expect(service.calculateTimeOnLesson('lesson-b')).toBe(7);
  });

  it('T6.4: tracks multiple lessons independently', () => {
    service.recordLessonStart('lesson-x');
    vi.advanceTimersByTime(3000);
    service.recordLessonStart('lesson-y');
    vi.advanceTimersByTime(2000);

    expect(service.calculateTimeOnLesson('lesson-x')).toBe(5);
    expect(service.calculateTimeOnLesson('lesson-y')).toBe(2);
  });

  it('T6.5: after resetSession, returns 0 for a previously recorded lesson', () => {
    service.recordLessonStart('lesson-c');
    vi.advanceTimersByTime(10000);
    service.resetSession();
    expect(service.calculateTimeOnLesson('lesson-c')).toBe(0);
  });
});

// -----------------------------------------------------------------------
// Group 7: resetSession (T7.1–T7.3)
// -----------------------------------------------------------------------
describe('TrackingService — resetSession', () => {
  let service: TrackingService;
  let provider: ReturnType<typeof makeProviderMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    ({ service, provider } = setupTestBed());
  });

  afterEach(() => TestBed.resetTestingModule());

  it('T7.1: calls provider.reset()', () => {
    service.resetSession();
    expect(provider.reset).toHaveBeenCalledTimes(1);
  });

  it('T7.2: resets firstLessonCompletedThisSession to false', () => {
    service.trackLessonCompleted(makeLessonContext(), 60);
    service.resetSession();

    const flag = (service as unknown as { firstLessonCompletedThisSession: boolean }).firstLessonCompletedThisSession;
    expect(flag).toBe(false);
  });

  it('T7.3: does not throw even if provider.reset throws internally', () => {
    provider.reset.mockImplementationOnce(() => { throw new Error('provider error'); });
    expect(() => service.resetSession()).not.toThrow();
  });
});

// -----------------------------------------------------------------------
// Group 8: Integração com CourseProgressService (T8.1–T8.4)
// -----------------------------------------------------------------------
describe('CourseProgressService + TrackingService integration', () => {
  let progressService: CourseProgressService;
  let trackingService: TrackingService;

  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== 'undefined') localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        TrackingService,
        CourseProgressService,
        { provide: AuthService, useValue: makeAuthMock(makeUser()) },
        { provide: SupabaseService, useValue: makeSupabaseMock() },
        { provide: EVENT_TRACKING_PROVIDER, useValue: makeProviderMock() as unknown as EventTrackingProvider }
      ]
    });

    progressService = TestBed.inject(CourseProgressService);
    trackingService = TestBed.inject(TrackingService);
  });

  afterEach(() => {
    if (typeof localStorage !== 'undefined') localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('T8.1: does not call trackLessonCompleted when completed is false', () => {
    const spy = vi.spyOn(trackingService, 'trackLessonCompleted');
    progressService.setLessonCompleted('start', 'lesson-intro', false, makeLessonContext());
    expect(spy).not.toHaveBeenCalled();
  });

  it('T8.2: does not call trackLessonCompleted when trackingContext is omitted', () => {
    const spy = vi.spyOn(trackingService, 'trackLessonCompleted');
    progressService.setLessonCompleted('start', 'lesson-intro', true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('T8.3: calls trackLessonCompleted when completed=true and context is provided', () => {
    const spy = vi.spyOn(trackingService, 'trackLessonCompleted');
    const ctx = makeLessonContext();
    progressService.setLessonCompleted('start', ctx.lessonId, true, ctx);
    expect(spy).toHaveBeenCalledWith(ctx, expect.any(Number));
  });

  it('T8.4: passes the time calculated from calculateTimeOnLesson', () => {
    vi.useFakeTimers();
    const ctx = makeLessonContext();

    trackingService.recordLessonStart(ctx.lessonId);
    vi.advanceTimersByTime(15000);

    const spy = vi.spyOn(trackingService, 'trackLessonCompleted');
    progressService.setLessonCompleted('start', ctx.lessonId, true, ctx);

    expect(spy.mock.calls[0][1]).toBe(15);

    vi.useRealTimers();
  });
});
