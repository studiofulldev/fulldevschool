import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { NavigationNode, SchoolContentService } from '../data/school-content.service';
import { SeoService } from '../services/seo.service';
import { ThemeService } from '../services/theme.service';
import { PlatformDataService } from '../services/platform-data.service';

@Component({
  selector: 'app-course-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatSidenavModule, MatIconModule, MatExpansionModule, MatButtonModule],
  templateUrl: '../app.html',
  styleUrl: '../app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseShellComponent {
  private readonly hiddenSections = new Set(['16-painel-de-progresso', '90-templates']);
  private readonly navStorageKey = 'fulldev-school.nav.expanded-sections';
  private readonly sidebarStorageKey = 'fulldev-school.nav.sidebar-expanded';
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly content = inject(SchoolContentService);
  protected readonly seo = inject(SeoService);
  protected readonly theme = inject(ThemeService);
  private readonly platform = inject(PlatformDataService);

  protected readonly expandedSections = signal<Record<string, boolean>>(this.readExpandedSections());
  protected readonly sidebarExpanded = signal(this.readSidebarExpanded());
  protected readonly readingProgress = signal(0);
  protected readonly navTree = this.content.navigationTree;
  protected readonly courseSlug = toSignal(this.route.paramMap.pipe(map((params) => params.get('courseSlug') ?? 'start')), {
    initialValue: 'start'
  });
  protected readonly navSections = computed(() => {
    const sections = new Map<string, { key: string; title: string; nodes: NavigationNode[] }>();

    for (const node of this.navTree()) {
      if (this.hiddenSections.has(node.section)) {
        continue;
      }

      if (!sections.has(node.section)) {
        sections.set(node.section, {
          key: node.section,
          title: node.sectionTitle ?? this.humanizeSection(node.section),
          nodes: []
        });
      }

      sections.get(node.section)?.nodes.push(node);
    }

    return [...sections.values()];
  });
  protected readonly isHandset = toSignal(
    this.breakpointObserver.observe('(max-width: 960px)').pipe(map((state) => state.matches)),
    { initialValue: false }
  );
  protected readonly currentUrl = toSignal(this.router.events.pipe(map(() => this.router.url)), { initialValue: this.router.url });
  protected readonly currentTitle = computed(() => {
    this.currentUrl();
    const lessonTitle = this.content.currentLesson()?.meta.title;
    if (lessonTitle) {
      return lessonTitle;
    }

    const moduleSlug = this.route.firstChild?.snapshot.paramMap.get('moduleSlug') ?? null;
    if (moduleSlug) {
      return this.platform.getModuleBySlug(this.courseSlug(), moduleSlug)?.title ?? 'Módulo';
    }

    return this.platform.getCourseBySlug(this.courseSlug())?.title ?? 'Fulldev School';
  });
  protected readonly activeSectionKey = computed(() => {
    this.currentUrl();
    const lessonSlug = this.route.firstChild?.snapshot.paramMap.get('lessonSlug') ?? null;
    if (lessonSlug) {
      return this.navTree().find((node) => node.slug === lessonSlug)?.section ?? null;
    }

    const moduleSlug = this.route.firstChild?.snapshot.paramMap.get('moduleSlug') ?? null;
    return moduleSlug ? moduleSlug : null;
  });

  constructor() {
    void this.content.ensureNavigationLoaded();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    effect(() => {
      this.platform.setCurrentCourseSlug(this.courseSlug());
      const isLessonRoute = this.currentUrl().includes('/lessons/');
      if (!isLessonRoute) {
        this.content.clearCurrentLesson();
      }
      this.seo.updatePageSeo(
        this.content.currentLesson(),
        this.navTree(),
        this.currentUrl(),
        this.content.currentLesson()?.meta.estimatedReadingMinutes ?? 1
      );
    });
  }

  protected setSectionExpanded(sectionKey: string, expanded: boolean): void {
    this.expandedSections.update((current) => {
      const next = { ...current, [sectionKey]: expanded };
      this.writeExpandedSections(next);
      return next;
    });
  }

  protected isSectionExpanded(sectionKey: string): boolean {
    const expanded = this.expandedSections();
    return expanded[sectionKey] ?? this.activeSectionKey() === sectionKey;
  }

  protected lessonLink(node: NavigationNode): string {
    return `/courses/${this.courseSlug()}/lessons/${node.slug}`;
  }

  protected isSidebarExpanded(): boolean {
    return this.isHandset() ? false : this.sidebarExpanded();
  }

  protected toggleSidebar(): void {
    if (this.isHandset()) {
      return;
    }

    this.sidebarExpanded.update((current) => {
      const next = !current;
      this.writeSidebarExpanded(next);
      return next;
    });
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    const documentElement = document.documentElement;
    const scrollTop = window.scrollY || documentElement.scrollTop || 0;
    const maxScroll = documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll <= 0 ? 0 : (scrollTop / maxScroll) * 100;
    this.readingProgress.set(Math.max(0, Math.min(progress, 100)));
  }

  protected navLabel(node: NavigationNode): string {
    const source = node.navTitle || node.title;
    return source
      .replace('Fundamentos de Tecnologia', 'Fund. de Tecnologia')
      .replace('Fundamentos Digitais', 'Fund. Digitais')
      .replace('Mentalidade e Consistência', 'Mentalidade e Consist.')
      .replace('Comunidade e Networking', 'Comunidade e Netw.')
      .replace('Visão Geral do Guia', 'Visão Geral');
  }

  private humanizeSection(section: string): string {
    return section
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private readExpandedSections(): Record<string, boolean> {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(this.navStorageKey);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  private writeExpandedSections(state: Record<string, boolean>): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.navStorageKey, JSON.stringify(state));
    }
  }

  private readSidebarExpanded(): boolean {
    if (typeof localStorage === 'undefined') {
      return true;
    }

    try {
      const raw = localStorage.getItem(this.sidebarStorageKey);
      return raw ? raw === 'true' : true;
    } catch {
      return true;
    }
  }

  private writeSidebarExpanded(expanded: boolean): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.sidebarStorageKey, String(expanded));
    }
  }
}
