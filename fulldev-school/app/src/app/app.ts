import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { NavigationNode, SchoolContentService } from './data/school-content.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatExpansionModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly hiddenSections = new Set(['16-painel-de-progresso', '90-templates']);
  private readonly navStorageKey = 'fulldev-school.nav.expanded-sections';
  private readonly sidebarStorageKey = 'fulldev-school.nav.sidebar-expanded';
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly content = inject(SchoolContentService);
  protected readonly theme = inject(ThemeService);

  protected readonly expandedSections = signal<Record<string, boolean>>(this.readExpandedSections());
  protected readonly sidebarExpanded = signal(this.readSidebarExpanded());
  protected readonly readingProgress = signal(0);
  protected readonly navTree = this.content.navigationTree;
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
  protected readonly currentUrl = toSignal(
    this.router.events.pipe(map(() => this.router.url)),
    { initialValue: this.router.url }
  );
  protected readonly currentTitle = computed(() => this.content.currentLesson()?.meta.title ?? 'Fulldev School');
  protected readonly activeSectionKey = computed(() => {
    const currentSlug = this.currentUrl().replace(/^\/+/, '') || this.navTree()[0]?.slug || '';
    return this.navTree().find((node) => node.slug === currentSlug)?.section ?? null;
  });

  constructor() {
    void this.content.ensureNavigationLoaded();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected setSectionExpanded(sectionKey: string, expanded: boolean): void {
    this.expandedSections.update((current) => {
      const next = {
        ...current,
        [sectionKey]: expanded
      };

      this.writeExpandedSections(next);
      return next;
    });
  }

  protected isSectionExpanded(sectionKey: string): boolean {
    const expanded = this.expandedSections();
    return expanded[sectionKey] ?? this.activeSectionKey() === sectionKey;
  }

  protected lessonLink(node: NavigationNode): string {
    const firstSlug = this.navTree()[0]?.slug;
    return node.slug === firstSlug ? '/' : `/${node.slug}`;
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
      .replace('Projetos e Portfólio', 'Projetos e Portfólio')
      .replace('Mercado de Trabalho', 'Mercado de Trabalho')
      .replace('FAQ do Iniciante', 'FAQ do Iniciante')
      .replace('Recursos Curados', 'Recursos Curados')
      .replace('Mapa das Áreas', 'Mapa das Áreas')
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
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.navStorageKey, JSON.stringify(state));
    } catch {
      // Ignore storage failures and keep the current in-memory state.
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
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.sidebarStorageKey, String(expanded));
    } catch {
      // Ignore storage failures and keep the current in-memory state.
    }
  }
}
