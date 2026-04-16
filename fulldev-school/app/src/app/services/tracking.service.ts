import { Injectable, Injector, inject } from '@angular/core';
import posthog from 'posthog-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface LessonTrackingContext {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  courseId: string;
  lessonIndex: number;
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
  // Injector used to resolve AuthService lazily, breaking the circular dep:
  // AuthService -> TrackingService -> AuthService.
  // AuthService is only needed at method call time (not at construction time),
  // so we defer resolution until the injector graph is fully settled.
  private readonly injector = inject(Injector);
  private _auth: AuthService | null = null;

  private get auth(): AuthService {
    if (!this._auth) {
      this._auth = this.injector.get(AuthService);
    }

    return this._auth;
  }

  private readonly sessionId = crypto.randomUUID();
  private firstLessonCompletedThisSession = false;
  private readonly lessonStartTimes = new Map<string, number>();

  constructor() {
    const { apiKey, host } = environment.posthog;
    if (!apiKey) {
      return;
    }

    posthog.init(apiKey, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      person_profiles: 'identified_only'
    });
  }

  trackSessionStarted(user: import('./auth.service').AuthUser, isFirstSession: boolean): void {
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      role: user.role
    });

    let daysSinceSignup = -1;
    if (user.acceptedTermsAt) {
      daysSinceSignup = Math.floor(
        (Date.now() - new Date(user.acceptedTermsAt).getTime()) / 86_400_000
      );
    }

    posthog.capture('session_started', {
      user_id: user.id,
      user_role: user.role,
      platform: 'web',
      is_first_session: isFirstSession,
      days_since_signup: daysSinceSignup
    });
  }

  trackLessonStarted(context: LessonTrackingContext): void {
    const user = this.auth.user();

    posthog.capture('lesson_started', {
      user_id: user?.id,
      user_role: user?.role,
      platform: 'web',
      session_id: this.sessionId,
      lesson_id: context.lessonId,
      lesson_title: context.lessonTitle,
      module_id: context.moduleId,
      course_id: context.courseId,
      lesson_index: context.lessonIndex
    });
  }

  trackLessonCompleted(context: LessonTrackingContext, timeOnLesson: number): void {
    const user = this.auth.user();
    const isFirst = !this.firstLessonCompletedThisSession;

    if (isFirst) {
      this.firstLessonCompletedThisSession = true;
    }

    posthog.capture('lesson_completed', {
      user_id: user?.id,
      user_role: user?.role,
      platform: 'web',
      session_id: this.sessionId,
      lesson_id: context.lessonId,
      lesson_title: context.lessonTitle,
      module_id: context.moduleId,
      course_id: context.courseId,
      lesson_index: context.lessonIndex,
      time_on_lesson: timeOnLesson,
      first_lesson_completed: isFirst
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trackStreakUpdated(_newStreak: number): void {
    // Future implementation
  }

  resetSession(): void {
    try {
      posthog.reset();
    } catch {
      // Never propagate posthog errors to callers
    }

    this.firstLessonCompletedThisSession = false;
    this.lessonStartTimes.clear();
  }

  recordLessonStart(lessonId: string): void {
    this.lessonStartTimes.set(lessonId, Date.now());
  }

  calculateTimeOnLesson(lessonId: string): number {
    const start = this.lessonStartTimes.get(lessonId);
    if (start === undefined) {
      return 0;
    }

    return Math.floor((Date.now() - start) / 1000);
  }
}
