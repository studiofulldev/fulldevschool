import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { of } from 'rxjs';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    identify: vi.fn(),
    capture: vi.fn(),
    reset: vi.fn()
  }
}));

import posthog from 'posthog-js';
import { TrackingService, LessonTrackingContext } from './tracking.service';
import { AuthService } from './auth.service';
import { CourseProgressService } from './course-progress.service';
import { SupabaseService } from './supabase.service';

const mockPosthog = posthog as unknown as {
  init: ReturnType<typeof vi.fn>;
  identify: ReturnType<typeof vi.fn>;
  capture: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
};

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

function setupTestBed(userValue: ReturnType<typeof makeUser> | null = null) {
  TestBed.configureTestingModule({
    providers: [
      TrackingService,
      { provide: AuthService, useValue: makeAuthMock(userValue) },
      { provide: SupabaseService, useValue: makeSupabaseMock() }
    ]
  });
  return TestBed.inject(TrackingService);
}

// -----------------------------------------------------------------------
// Group 1: Initialization (T1.1–T1.3)
// -----------------------------------------------------------------------
describe('TrackingService — initialization', () => {
  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('T1.1: does not call posthog.init when apiKey is empty (dev environment)', () => {
    // In the development environment.ts, apiKey is always ''.
    // TrackingService guards on apiKey before calling posthog.init.
    setupTestBed();
    expect(mockPosthog.init).not.toHaveBeenCalled();
  });

  it('T1.2: generates a unique sessionId (UUID format)', () => {
    const service = setupTestBed();
    const sessionId = (service as unknown as { sessionId: string }).sessionId;
    expect(sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('T1.3: starts with firstLessonCompletedThisSession = false', () => {
    const service = setupTestBed();
    const flag = (service as unknown as { firstLessonCompletedThisSession: boolean }).firstLessonCompletedThisSession;
    expect(flag).toBe(false);
  });
});

// -----------------------------------------------------------------------
// Group 2: trackSessionStarted (T2.1–T2.6)
// -----------------------------------------------------------------------
describe('TrackingService — trackSessionStarted', () => {
  let service: TrackingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = setupTestBed();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('T2.1: calls posthog.identify with user id and pseudonymous properties (no PII)', () => {
    const user = makeUser();
    service.trackSessionStarted(user as never, false);

    // email and name are intentionally excluded — sending PII to PostHog
    // requires explicit LGPD legal basis. UUID + role is sufficient for
    // identity stitching and funnel analysis.
    expect(mockPosthog.identify).toHaveBeenCalledWith(user.id, {
      role: user.role,
      technical_level: null
    });
  });

  it('T2.2: captures session_started with required properties', () => {
    const user = makeUser();
    service.trackSessionStarted(user as never, true);

    expect(mockPosthog.capture).toHaveBeenCalledWith('session_started', expect.objectContaining({
      user_id: user.id,
      user_role: user.role,
      platform: 'web',
      is_first_session: true
    }));
  });

  it('T2.3: days_since_signup is calculated correctly from acceptedTermsAt', () => {
    vi.useFakeTimers();
    const now = new Date('2026-04-16T12:00:00.000Z');
    vi.setSystemTime(now);

    const user = makeUser({ acceptedTermsAt: '2026-01-01T12:00:00.000Z' });
    service.trackSessionStarted(user as never, false);

    const call = mockPosthog.capture.mock.calls[0];
    const props = call[1] as Record<string, unknown>;
    expect(props['days_since_signup']).toBe(105);

    vi.useRealTimers();
  });

  it('T2.4: days_since_signup is -1 when acceptedTermsAt is null', () => {
    const user = makeUser({ acceptedTermsAt: null });
    service.trackSessionStarted(user as never, false);

    const call = mockPosthog.capture.mock.calls[0];
    const props = call[1] as Record<string, unknown>;
    expect(props['days_since_signup']).toBe(-1);
  });

  it('T2.5: is_first_session is false when passed as false', () => {
    const user = makeUser();
    service.trackSessionStarted(user as never, false);

    const call = mockPosthog.capture.mock.calls[0];
    const props = call[1] as Record<string, unknown>;
    expect(props['is_first_session']).toBe(false);
  });

  it('T2.6: is_first_session is true when passed as true', () => {
    const user = makeUser();
    service.trackSessionStarted(user as never, true);

    const call = mockPosthog.capture.mock.calls[0];
    const props = call[1] as Record<string, unknown>;
    expect(props['is_first_session']).toBe(true);
  });
});

// -----------------------------------------------------------------------
// Group 3: trackLessonStarted (T3.1–T3.3)
// -----------------------------------------------------------------------
describe('TrackingService — trackLessonStarted', () => {
  let service: TrackingService;
  const user = makeUser();

  beforeEach(() => {
    vi.clearAllMocks();
    service = setupTestBed(user);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('T3.1: captures lesson_started with all context fields', () => {
    const ctx = makeLessonContext();
    service.trackLessonStarted(ctx);

    expect(mockPosthog.capture).toHaveBeenCalledWith('lesson_started', expect.objectContaining({
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

    expect(mockPosthog.capture).toHaveBeenCalledWith('lesson_started', expect.objectContaining({
      user_id: user.id,
      user_role: user.role
    }));
  });

  it('T3.3: includes platform web and session_id', () => {
    const ctx = makeLessonContext();
    service.trackLessonStarted(ctx);

    const call = mockPosthog.capture.mock.calls[0];
    const props = call[1] as Record<string, unknown>;
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
  const user = makeUser();

  beforeEach(() => {
    vi.clearAllMocks();
    service = setupTestBed(user);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('T4.1: captures lesson_completed with all context fields', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 120);

    expect(mockPosthog.capture).toHaveBeenCalledWith('lesson_completed', expect.objectContaining({
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

    const call = mockPosthog.capture.mock.calls[0];
    const props = call[1] as Record<string, unknown>;
    expect(props['time_on_lesson']).toBe(300);
  });

  it('T4.3: includes user_id and user_role from AuthService', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 60);

    expect(mockPosthog.capture).toHaveBeenCalledWith('lesson_completed', expect.objectContaining({
      user_id: user.id,
      user_role: user.role
    }));
  });

  it('T4.4: includes platform and session_id', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 60);

    const call = mockPosthog.capture.mock.calls[0];
    const props = call[1] as Record<string, unknown>;
    expect(props['platform']).toBe('web');
    expect(typeof props['session_id']).toBe('string');
  });

  it('T4.5: first_lesson_completed is true on the first call', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 60);

    const call = mockPosthog.capture.mock.calls[0];
    const props = call[1] as Record<string, unknown>;
    expect(props['first_lesson_completed']).toBe(true);
  });

  it('T4.6: first_lesson_completed is false on subsequent calls', () => {
    const ctx1 = makeLessonContext({ lessonId: 'lesson-1' });
    const ctx2 = makeLessonContext({ lessonId: 'lesson-2' });
    service.trackLessonCompleted(ctx1, 60);
    service.trackLessonCompleted(ctx2, 90);

    const secondCall = mockPosthog.capture.mock.calls[1];
    const props = secondCall[1] as Record<string, unknown>;
    expect(props['first_lesson_completed']).toBe(false);
  });
});

// -----------------------------------------------------------------------
// Group 5: first_lesson_completed idempotency (T5.1–T5.3)
// -----------------------------------------------------------------------
describe('TrackingService — first_lesson_completed idempotency', () => {
  let service: TrackingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = setupTestBed(makeUser());
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('T5.1: always sends first_lesson_completed explicitly (even when false)', () => {
    const ctx1 = makeLessonContext({ lessonId: 'l1' });
    const ctx2 = makeLessonContext({ lessonId: 'l2' });
    service.trackLessonCompleted(ctx1, 30);
    service.trackLessonCompleted(ctx2, 45);

    const secondCall = mockPosthog.capture.mock.calls[1];
    const props = secondCall[1] as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(props, 'first_lesson_completed')).toBe(true);
    expect(props['first_lesson_completed']).toBe(false);
  });

  it('T5.2: after resetSession, first_lesson_completed is true again', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 60);
    service.resetSession();
    vi.clearAllMocks();
    service.trackLessonCompleted(ctx, 30);

    const call = mockPosthog.capture.mock.calls[0];
    const props = call[1] as Record<string, unknown>;
    expect(props['first_lesson_completed']).toBe(true);
  });

  it('T5.3: flag flips to true after first completion and stays true across more completions', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 60);

    const flag = (service as unknown as { firstLessonCompletedThisSession: boolean }).firstLessonCompletedThisSession;
    expect(flag).toBe(true);

    const ctx2 = makeLessonContext({ lessonId: 'l2' });
    service.trackLessonCompleted(ctx2, 90);
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
    service = setupTestBed();
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

  beforeEach(() => {
    vi.clearAllMocks();
    service = setupTestBed();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('T7.1: calls posthog.reset()', () => {
    service.resetSession();
    expect(mockPosthog.reset).toHaveBeenCalledTimes(1);
  });

  it('T7.2: resets firstLessonCompletedThisSession to false', () => {
    const ctx = makeLessonContext();
    service.trackLessonCompleted(ctx, 60);
    service.resetSession();

    const flag = (service as unknown as { firstLessonCompletedThisSession: boolean }).firstLessonCompletedThisSession;
    expect(flag).toBe(false);
  });

  it('T7.3: does not throw even if posthog.reset throws internally', () => {
    mockPosthog.reset.mockImplementationOnce(() => { throw new Error('PostHog error'); });
    expect(() => service.resetSession()).not.toThrow();
  });
});

// -----------------------------------------------------------------------
// Group 8: Integration with CourseProgressService (T8.1–T8.4)
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
        { provide: SupabaseService, useValue: makeSupabaseMock() }
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
    const ctx = makeLessonContext();
    progressService.setLessonCompleted('start', 'lesson-intro', false, ctx);
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

    const timeArg = spy.mock.calls[0][1];
    expect(timeArg).toBe(15);

    vi.useRealTimers();
  });
});
