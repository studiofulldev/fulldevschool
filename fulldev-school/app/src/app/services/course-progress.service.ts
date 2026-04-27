import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter } from 'rxjs/operators';
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
  private readonly legacyMigratedUsers = new Set<string>();

  constructor() {
    // After the initial session check completes, pull Supabase progress and
    // merge it into localStorage. We subscribe to the one-shot observable
    // rather than reacting on every auth change to avoid redundant fetches.
    this.auth.sessionCheckComplete$.subscribe(() => {
      void this.hydrateFromSupabase();
    });

    // If the user changes after the initial check (logout/login), keep local
    // progress isolated by user id and hydrate again.
    toObservable(this.auth.user)
      .pipe(
        filter(() => this.auth.sessionCheckComplete()),
        distinctUntilChanged((a, b) => a?.id === b?.id)
      )
      .subscribe((user) => {
        if (!user) {
          return;
        }

        this.migrateLegacyProgressToUser(user.id);
        void this.hydrateFromSupabase(user.id);
      });
  }

  // ----------------------------------------------------------------
  // Public read API
  // ----------------------------------------------------------------

  isLessonCompleted(courseSlug: string, lessonSlug: string): boolean {
    const storageKey = this.resolveStorageKey(this.lessonStorageKey);
    return this.readState(storageKey)[this.lessonKey(courseSlug, lessonSlug)] ?? false;
  }

  isModuleCompleted(courseSlug: string, moduleSlug: string): boolean {
    const storageKey = this.resolveStorageKey(this.moduleStorageKey);
    return this.readState(storageKey)[this.moduleKey(courseSlug, moduleSlug)] ?? false;
  }

  isCourseCompleted(courseSlug: string): boolean {
    const storageKey = this.resolveStorageKey(this.courseStorageKey);
    return this.readState(storageKey)[courseSlug] ?? false;
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
    const storageKey = this.resolveStorageKey(this.lessonStorageKey);
    const state = this.readState(storageKey);
    state[this.lessonKey(courseSlug, lessonSlug)] = completed;
    this.writeState(storageKey, state);

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
    const storageKey = this.resolveStorageKey(this.moduleStorageKey);
    const state = this.readState(storageKey);
    state[this.moduleKey(courseSlug, moduleSlug)] = completed;
    this.writeState(storageKey, state);

    void this.syncToSupabase({
      course_slug: courseSlug,
      lesson_slug: null,
      module_slug: moduleSlug,
      type: 'module',
      completed
    });
  }

  setCourseCompleted(courseSlug: string, completed: boolean): void {
    const storageKey = this.resolveStorageKey(this.courseStorageKey);
    const state = this.readState(storageKey);
    state[courseSlug] = completed;
    this.writeState(storageKey, state);

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
  private async hydrateFromSupabase(userId = this.auth.user()?.id): Promise<void> {
    if (!userId) {
      return;
    }

    try {
      const { data, error } = await this.supabase.fetchUserProgress(userId);
      if (error || !data) {
        this.logger.error('CourseProgressService', 'hydrateFromSupabase failed', error);
        return;
      }

      const lessonStorageKey = this.resolveStorageKey(this.lessonStorageKey, userId);
      const moduleStorageKey = this.resolveStorageKey(this.moduleStorageKey, userId);
      const courseStorageKey = this.resolveStorageKey(this.courseStorageKey, userId);

      const lessons = this.readState(lessonStorageKey);
      const modules = this.readState(moduleStorageKey);
      const courses = this.readState(courseStorageKey);

      for (const row of data) {
        if (row.type === 'lesson' && row.lesson_slug) {
          lessons[this.lessonKey(row.course_slug, row.lesson_slug)] = row.completed;
        } else if (row.type === 'module' && row.module_slug) {
          modules[this.moduleKey(row.course_slug, row.module_slug)] = row.completed;
        } else if (row.type === 'course') {
          courses[row.course_slug] = row.completed;
        }
      }

      this.writeState(lessonStorageKey, lessons);
      this.writeState(moduleStorageKey, modules);
      this.writeState(courseStorageKey, courses);
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

  private resolveStorageKey(baseKey: string, userId = this.auth.user()?.id): string {
    // Unauthenticated users keep the legacy keys for backward compatibility.
    if (!userId) {
      return baseKey;
    }

    if (!this.legacyMigratedUsers.has(userId)) {
      this.migrateLegacyProgressToUser(userId);
      this.legacyMigratedUsers.add(userId);
    }

    return `${baseKey}.${userId}`;
  }

  private migrateLegacyProgressToUser(userId: string): void {
    // Merge pre-user-scoped progress into this user and delete legacy keys so
    // progress doesn't leak across accounts on shared browsers.
    for (const baseKey of [this.lessonStorageKey, this.moduleStorageKey, this.courseStorageKey]) {
      const legacy = this.readState(baseKey);
      if (Object.keys(legacy).length === 0) {
        continue;
      }

      const scopedKey = `${baseKey}.${userId}`;
      const scoped = this.readState(scopedKey);
      this.writeState(scopedKey, { ...legacy, ...scoped });
      this.removeState(baseKey);
    }
  }

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

  private removeState(storageKey: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(storageKey);
  }
}
