import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CourseContentProgressService {
  private readonly storageKey = 'fulldev-school.v2.course-content-progress';

  private readonly state = signal<Record<string, boolean>>(this.read());

  isTopicCompleted(courseSlug: string, topicSlug: string): boolean {
    return this.state()[this.key(courseSlug, topicSlug)] ?? false;
  }

  setTopicCompleted(courseSlug: string, topicSlug: string, completed: boolean): void {
    const next = { ...this.state() };
    next[this.key(courseSlug, topicSlug)] = completed;
    this.state.set(next);
    this.write(next);
  }

  progressPercent(courseSlug: string, topicSlugs: string[]): number {
    if (topicSlugs.length === 0) {
      return 0;
    }

    const completedCount = topicSlugs.filter((slug) => this.isTopicCompleted(courseSlug, slug)).length;
    return Math.round((completedCount / topicSlugs.length) * 100);
  }

  private key(courseSlug: string, topicSlug: string): string {
    return `${courseSlug}::topic::${topicSlug}`;
  }

  private read(): Record<string, boolean> {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  private write(state: Record<string, boolean>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }
}

