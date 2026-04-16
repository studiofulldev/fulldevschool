import { Injectable, Injector, inject } from '@angular/core';
import type { AuthUser } from './auth.service';
import { AuthService } from './auth.service';
import { EVENT_TRACKING_PROVIDER } from './event-tracking.provider';

export interface LessonTrackingContext {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  courseId: string;
  lessonIndex: number;
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
  // Injector usado para resolver AuthService de forma lazy, quebrando a dep circular:
  // AuthService -> TrackingService -> AuthService.
  private readonly injector = inject(Injector);
  private readonly provider = inject(EVENT_TRACKING_PROVIDER);
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

  trackSessionStarted(user: AuthUser, isFirstSession: boolean): void {
    this.provider.identify(user.id, {
      role: user.role,
      technical_level: user.technicalLevel ?? null
    });

    let daysSinceSignup = -1;
    if (user.acceptedTermsAt) {
      daysSinceSignup = Math.floor(
        (Date.now() - new Date(user.acceptedTermsAt).getTime()) / 86_400_000
      );
    }

    this.provider.capture('session_started', {
      user_id: user.id,
      user_role: user.role,
      platform: 'web',
      is_first_session: isFirstSession,
      days_since_signup: daysSinceSignup
    });
  }

  trackLessonStarted(context: LessonTrackingContext): void {
    const user = this.auth.user();

    this.provider.capture('lesson_started', {
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

    this.provider.capture('lesson_completed', {
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

  // TODO(streak-okr): implementar quando streak for entregue (OKR 3 / KR1)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trackStreakUpdated(_newStreak: number): void {
    // Stub — conectado mas intencionalmente vazio até streak ser construído.
  }

  resetSession(): void {
    try {
      this.provider.reset();
    } catch {
      // Nunca propagar erros de tracking para os callers.
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

    // Remove a entrada após leitura — o tempo foi consumido.
    this.lessonStartTimes.delete(lessonId);
    return Math.floor((Date.now() - start) / 1000);
  }
}
