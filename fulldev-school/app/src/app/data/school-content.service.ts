import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { marked } from 'marked';

export interface NavigationNode {
  id: string;
  slug: string;
  title: string;
  navTitle?: string;
  type: 'page';
  order: number;
  section: string;
  sectionTitle?: string;
  markdownPath: string;
  audioManifestPath?: string | null;
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
  blocks: LessonBlock[];
}

export interface LessonBlock {
  id: string;
  title: string;
  markdown: string;
  html: string;
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

    const ordered = [...tree.root].sort((a, b) => a.order - b.order);
    this._navigationTree.set(ordered);
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
    const lesson = this.parseLessonSource(source, target);
    this._currentLesson.set(lesson);

    try {
      if (!target.audioManifestPath) {
        this._currentAudio.set(null);
        return lesson;
      }

      const audio = await firstValueFrom(this.http.get<AudioManifest>(target.audioManifestPath));
      this._currentAudio.set(audio);
    } catch {
      this._currentAudio.set(null);
    }

    return lesson;
  }

  private parseLessonSource(source: string, node: NavigationNode): LessonContent {
    const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      const markdown = source.trim();
      return {
        meta: this.createMetaFromNode(node),
        markdown,
        blocks: this.parseBlocks(markdown, node.title)
      };
    }

    const [, rawMeta, markdown] = frontmatterMatch;
    const meta = this.parseFrontmatter(rawMeta, node);
    const trimmedMarkdown = markdown.trim();
    return {
      meta,
      markdown: trimmedMarkdown,
      blocks: this.parseBlocks(trimmedMarkdown, meta.title)
    };
  }

  private createMetaFromNode(node: NavigationNode): LessonMeta {
    const orderedNodes = this._navigationTree();
    const currentIndex = orderedNodes.findIndex((item) => item.id === node.id);

    return {
      id: node.id,
      slug: node.slug,
      title: node.title,
      section: node.sectionTitle ?? node.section,
      order: node.order,
      previousLessonId: orderedNodes[currentIndex - 1]?.id || undefined,
      nextLessonId: orderedNodes[currentIndex + 1]?.id || undefined
    };
  }

  private parseFrontmatter(frontmatter: string, node: NavigationNode): LessonMeta {
    const parsed = Object.fromEntries(
      frontmatter
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const separator = line.indexOf(':');
          return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
        })
    );

    const orderedNodes = this._navigationTree();
    const currentIndex = orderedNodes.findIndex((item) => item.id === node.id);

    return {
      id: parsed['id'] ?? node.id,
      slug: parsed['slug'] ?? node.slug,
      title: parsed['title'] ?? node.title,
      section: parsed['section'] ?? node.sectionTitle ?? node.section,
      order: Number(parsed['order'] ?? node.order),
      previousLessonId: parsed['previousLessonId'] || orderedNodes[currentIndex - 1]?.id || undefined,
      nextLessonId: parsed['nextLessonId'] || orderedNodes[currentIndex + 1]?.id || undefined,
      estimatedReadingMinutes: parsed['estimatedReadingMinutes']
        ? Number(parsed['estimatedReadingMinutes'])
        : undefined,
      estimatedListeningMinutes: parsed['estimatedListeningMinutes']
        ? Number(parsed['estimatedListeningMinutes'])
        : undefined
    };
  }

  private parseBlocks(markdown: string, fallbackTitle: string): LessonBlock[] {
    const withoutPageTitle = markdown.replace(/^#\s+.+\n+/m, '').trim();
    const sections = withoutPageTitle.split(/\n(?=##\s+)/g).filter(Boolean);

    if (sections.length === 0) {
      return [
        {
          id: this.slugify(fallbackTitle || 'conteudo'),
          title: fallbackTitle,
          markdown,
          html: this.renderMarkdown(withoutPageTitle || markdown)
        }
      ];
    }

    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      const isTitledSection = trimmedSection.startsWith('## ');

      if (!isTitledSection) {
        return {
          id: index === 0 ? 'intro' : `bloco-${index + 1}`,
          title: index === 0 ? fallbackTitle : `Bloco ${index + 1}`,
          markdown: trimmedSection,
          html: this.renderMarkdown(trimmedSection)
        };
      }

      const lines = trimmedSection.split('\n');
      const heading = lines[0].replace(/^##\s+/, '').trim();
      const id = this.slugify(heading || `bloco-${index + 1}`);
      const title = heading || `Bloco ${index + 1}`;
      const bodyMarkdown = lines.slice(1).join('\n').trim();

      return {
        id,
        title,
        markdown: bodyMarkdown,
        html: this.renderMarkdown(bodyMarkdown)
      };
    });
  }

  private renderMarkdown(markdown: string): string {
    const normalized = markdown
      .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '[$2](#)')
      .replace(/\[\[([^\]]+)\]\]/g, '[$1](#)');

    return marked.parse(normalized, {
      gfm: true,
      breaks: false
    }) as string;
  }
  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
