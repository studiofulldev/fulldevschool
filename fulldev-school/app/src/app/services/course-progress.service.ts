import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CourseProgressService {
  private readonly lessonStorageKey = 'fulldev-school.progress.lessons';
  private readonly moduleStorageKey = 'fulldev-school.progress.modules';
  private readonly courseStorageKey = 'fulldev-school.progress.courses';

  isLessonCompleted(courseSlug: string, lessonSlug: string): boolean {
    return this.readState(this.lessonStorageKey)[this.lessonKey(courseSlug, lessonSlug)] ?? false;
  }

  setLessonCompleted(courseSlug: string, lessonSlug: string, completed: boolean): void {
    const state = this.readState(this.lessonStorageKey);
    state[this.lessonKey(courseSlug, lessonSlug)] = completed;
    this.writeState(this.lessonStorageKey, state);
  }

  isModuleCompleted(courseSlug: string, moduleSlug: string): boolean {
    return this.readState(this.moduleStorageKey)[this.moduleKey(courseSlug, moduleSlug)] ?? false;
  }

  setModuleCompleted(courseSlug: string, moduleSlug: string, completed: boolean): void {
    const state = this.readState(this.moduleStorageKey);
    state[this.moduleKey(courseSlug, moduleSlug)] = completed;
    this.writeState(this.moduleStorageKey, state);
  }

  isCourseCompleted(courseSlug: string): boolean {
    return this.readState(this.courseStorageKey)[courseSlug] ?? false;
  }

  setCourseCompleted(courseSlug: string, completed: boolean): void {
    const state = this.readState(this.courseStorageKey);
    state[courseSlug] = completed;
    this.writeState(this.courseStorageKey, state);
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
}
