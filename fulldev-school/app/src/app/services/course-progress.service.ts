import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { SupabaseService } from './supabase.service';
import { TrackingService, LessonTrackingContext } from './tracking.service';

// Persistence strategy:
// - localStorage is written immediately for responsive UI (optimistic update).
// - Supabase is synced asynchronously after each write (fire-and-forget).
// - On initial load after login: Supabase data is fetched and merged with
//   localStorage. Supabase wins on conflict (server is source of truth).
// - Unauthenticated users: localStorage only (same behaviour as before).

@Injectable({ providedIn: 'root' })
export class CourseProgressService {
  private readonly auth = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly supabase = inject(SupabaseService);
  private readonly tracking = inject(TrackingService);

  private readonly lessonStorageKey = 'fulldev-school.progress.lessons';
  private readonly moduleStorageKey = 'fulldev-school.progress.modules';
  private readonly courseStorageKey = 'fulldev-school.progress.courses';

  constructor() {
    // After the initial session check completes, pull Supabase progress and
    // merge it into localStorage. We subscribe to the one-shot observable
    // rather than reacting on every auth change to avoid redundant fetches.
    this.auth.sessionCheckComplete$.subscribe(() => {
      void this.hydrateFromSupabase();
    });
  }

  // ----------------------------------------------------------------
  // Public read API
  // ----------------------------------------------------------------

  isLessonCompleted(courseSlug: string, lessonSlug: string): boolean {
    return this.readState(this.lessonStorageKey)[this.lessonKey(courseSlug, lessonSlug)] ?? false;
  }

  isModuleCompleted(courseSlug: string, moduleSlug: string): boolean {
    return this.readState(this.moduleStorageKey)[this.moduleKey(courseSlug, moduleSlug)] ?? false;
  }

  isCourseCompleted(courseSlug: string): boolean {
    return this.readState(this.courseStorageKey)[courseSlug] ?? false;
  }

  // ----------------------------------------------------------------
  // Public write API — optimistic localStorage + async Supabase sync
  // ----------------------------------------------------------------

  setLessonCompleted(
    courseSlug: string,
    lessonSlug: string,
    completed: boolean,
    trackingContext?: LessonTrackingContext
  ): void {
    const state = this.readState(this.lessonStorageKey);
    state[this.lessonKey(courseSlug, lessonSlug)] = completed;
    this.writeState(this.lessonStorageKey, state);

    if (completed && trackingContext) {
      const time = this.tracking.calculateTimeOnLesson(lessonSlug);
      this.tracking.trackLessonCompleted(trackingContext, time);
    }

    void this.syncToSupabase({
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      module_slug: null,
      type: 'lesson',
      completed
    });
  }

  setModuleCompleted(courseSlug: string, moduleSlug: string, completed: boolean): void {
    const state = this.readState(this.moduleStorageKey);
    state[this.moduleKey(courseSlug, moduleSlug)] = completed;
    this.writeState(this.moduleStorageKey, state);

    void this.syncToSupabase({
      course_slug: courseSlug,
      lesson_slug: null,
      module_slug: moduleSlug,
      type: 'module',
      completed
    });
  }

  setCourseCompleted(courseSlug: string, completed: boolean): void {
    const state = this.readState(this.courseStorageKey);
    state[courseSlug] = completed;
    this.writeState(this.courseStorageKey, state);

    void this.syncToSupabase({
      course_slug: courseSlug,
      lesson_slug: null,
      module_slug: null,
      type: 'course',
      completed
    });
  }

  // ----------------------------------------------------------------
  // Supabase sync
  // ----------------------------------------------------------------

  // Pull all progress rows from Supabase and merge into localStorage.
  // Supabase wins on conflict — server is the source of truth.
  private async hydrateFromSupabase(): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      return;
    }

    try {
      const { data, error } = await this.supabase.fetchUserProgress(user.id);
      if (error || !data) {
        this.logger.error('CourseProgressService', 'hydrateFromSupabase failed', error);
        return;
      }

      const lessons = this.readState(this.lessonStorageKey);
      const modules = this.readState(this.moduleStorageKey);
      const courses = this.readState(this.courseStorageKey);

      for (const row of data) {
        if (row.type === 'lesson' && row.lesson_slug) {
          lessons[this.lessonKey(row.course_slug, row.lesson_slug)] = row.completed;
        } else if (row.type === 'module' && row.module_slug) {
          modules[this.moduleKey(row.course_slug, row.module_slug)] = row.completed;
        } else if (row.type === 'course') {
          courses[row.course_slug] = row.completed;
        }
      }

      this.writeState(this.lessonStorageKey, lessons);
      this.writeState(this.moduleStorageKey, modules);
      this.writeState(this.courseStorageKey, courses);
    } catch (err) {
      this.logger.error('CourseProgressService', 'hydrateFromSupabase unexpected error', err);
    }
  }

  private async syncToSupabase(payload: {
    course_slug: string;
    lesson_slug: string | null;
    module_slug: string | null;
    type: 'lesson' | 'module' | 'course';
    completed: boolean;
  }): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      // Not authenticated — localStorage-only mode.
      return;
    }

    try {
      const { error } = await this.supabase.upsertProgress({
        user_id: user.id,
        course_slug: payload.course_slug,
        lesson_slug: payload.lesson_slug,
        module_slug: payload.module_slug,
        type: payload.type,
        completed: payload.completed,
        updated_at: new Date().toISOString()
      });

      if (error) {
        this.logger.error('CourseProgressService', 'syncToSupabase failed', error);
      }
    } catch (err) {
      this.logger.error('CourseProgressService', 'syncToSupabase unexpected error', err);
    }
  }

  // ----------------------------------------------------------------
  // localStorage helpers
  // ----------------------------------------------------------------

  private lessonKey(courseSlug: string, lessonSlug: string): string {
    return `${courseSlug}::lesson::${lessonSlug}`;
  }

  private moduleKey(courseSlug: string, moduleSlug: string): string {
    return `${courseSlug}::module::${moduleSlug}`;
  }

  private readState(storageKey: string): Record<string, boolean> {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  private writeState(storageKey: string, state: Record<string, boolean>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(state));
  }
}
