import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface NavigationNode {
  id: string;
  slug: string;
  title: string;
  type: 'page';
  order: number;
  section: string;
  markdownPath: string;
  audioManifestPath: string;
}

export interface LessonMeta {
  id: string;
  slug: string;
  title: string;
  section: string;
  order: number;
  previousLessonId?: string;
  nextLessonId?: string;
  estimatedReadingMinutes?: number;
  estimatedListeningMinutes?: number;
}

export interface LessonContent {
  meta: LessonMeta;
  markdown: string;
}

export interface AudioManifest {
  lessonId: string;
  mode: 'tts' | 'prerecorded';
  audioSrc: string | null;
  voice: {
    lang: string;
    name: string | null;
    rate: number;
    pitch: number;
  } | null;
  segments: Array<{
    blockId: string;
    start: number;
    end: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class SchoolContentService {
  private readonly http = inject(HttpClient);

  private readonly _navigationTree = signal<NavigationNode[]>([]);
  private readonly _currentLesson = signal<LessonContent | null>(null);
  private readonly _currentAudio = signal<AudioManifest | null>(null);

  readonly navigationTree = this._navigationTree.asReadonly();
  readonly currentLesson = this._currentLesson.asReadonly();
  readonly currentAudio = this._currentAudio.asReadonly();
  readonly previousLesson = computed(() => {
    const previousId = this._currentLesson()?.meta.previousLessonId;
    return this._navigationTree().find((node) => node.id === previousId) ?? null;
  });
  readonly nextLesson = computed(() => {
    const nextId = this._currentLesson()?.meta.nextLessonId;
    return this._navigationTree().find((node) => node.id === nextId) ?? null;
  });

  async ensureNavigationLoaded(): Promise<void> {
    if (this._navigationTree().length > 0) {
      return;
    }

    const tree = await firstValueFrom(
      this.http.get<{ root: NavigationNode[] }>('mock-db/navigation/tree.json')
    );
    this._navigationTree.set(tree.root);
  }

  async loadLessonBySlug(slug: string): Promise<LessonContent | null> {
    await this.ensureNavigationLoaded();
    const target = this._navigationTree().find((node) => node.slug === slug);

    if (!target) {
      this._currentLesson.set(null);
      this._currentAudio.set(null);
      return null;
    }

    const source = await firstValueFrom(this.http.get(target.markdownPath, { responseType: 'text' }));
    const lesson = this.parseLessonSource(source);
    this._currentLesson.set(lesson);

    try {
      const audio = await firstValueFrom(this.http.get<AudioManifest>(target.audioManifestPath));
      this._currentAudio.set(audio);
    } catch {
      this._currentAudio.set(null);
    }

    return lesson;
  }

  private parseLessonSource(source: string): LessonContent {
    const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      throw new Error('Lesson source sem frontmatter válido.');
    }

    const [, rawMeta, markdown] = frontmatterMatch;
    const meta = this.parseFrontmatter(rawMeta);
    return {
      meta,
      markdown: markdown.trim()
    };
  }

  private parseFrontmatter(frontmatter: string): LessonMeta {
    const entries = frontmatter
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      });

    const parsed = Object.fromEntries(entries);
    return {
      id: parsed['id'],
      slug: parsed['slug'],
      title: parsed['title'],
      section: parsed['section'],
      order: Number(parsed['order']),
      previousLessonId: parsed['previousLessonId'] || undefined,
      nextLessonId: parsed['nextLessonId'] || undefined,
      estimatedReadingMinutes: parsed['estimatedReadingMinutes']
        ? Number(parsed['estimatedReadingMinutes'])
        : undefined,
      estimatedListeningMinutes: parsed['estimatedListeningMinutes']
        ? Number(parsed['estimatedListeningMinutes'])
        : undefined
    };
  }
}
