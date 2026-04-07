import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationNode, SchoolContentService } from '../data/school-content.service';

export interface PlatformCourse {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverLabel: string;
  modules: PlatformModule[];
}

export interface PlatformModule {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  lessons: NavigationNode[];
}

@Injectable({ providedIn: 'root' })
export class PlatformDataService {
  private readonly content = inject(SchoolContentService);
  private readonly hiddenSections = new Set(['16-painel-de-progresso', '90-templates']);
  private readonly currentCourseSlugState = signal('start');

  readonly currentCourseSlug = this.currentCourseSlugState.asReadonly();
  readonly courses = computed(() => [this.buildStartCourse()]);

  async ensureReady(): Promise<void> {
    await this.content.ensureNavigationLoaded();
  }

  setCurrentCourseSlug(courseSlug: string): void {
    this.currentCourseSlugState.set(courseSlug);
  }

  getCourseBySlug(courseSlug: string): PlatformCourse | null {
    return this.courses().find((course) => course.slug === courseSlug) ?? null;
  }

  getModuleBySlug(courseSlug: string, moduleSlug: string): PlatformModule | null {
    return this.getCourseBySlug(courseSlug)?.modules.find((module) => module.slug === moduleSlug) ?? null;
  }

  getModuleForLesson(courseSlug: string, lessonSlug: string): PlatformModule | null {
    return (
      this.getCourseBySlug(courseSlug)?.modules.find((module) =>
        module.lessons.some((lesson) => lesson.slug === lessonSlug)
      ) ?? null
    );
  }

  private buildStartCourse(): PlatformCourse {
    const modulesMap = new Map<string, PlatformModule>();

    for (const node of this.content.navigationTree()) {
      if (this.hiddenSections.has(node.section)) {
        continue;
      }

      if (!modulesMap.has(node.section)) {
        modulesMap.set(node.section, {
          id: node.section,
          slug: node.section,
          title: node.sectionTitle ?? this.humanizeSection(node.section),
          description: `Modulo ${node.sectionTitle ?? this.humanizeSection(node.section)} do curso Start.`,
          order: node.order,
          lessons: []
        });
      }

      modulesMap.get(node.section)?.lessons.push(node);
    }

    const modules = [...modulesMap.values()].sort((a, b) => a.order - b.order);
    return {
      id: 'course-start',
      slug: 'start',
      title: 'Start: Começando na tecnologia',
      shortDescription:
        'Curso de entrada na área de tecnologia, com base digital, visão de mercado, fundamentos e próximos passos.',
      coverLabel: 'Start',
      modules
    };
  }

  private humanizeSection(section: string): string {
    return section
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
