import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly content = inject(SchoolContentService);
  protected readonly theme = inject(ThemeService);

  protected readonly expandedSections = signal<Record<string, boolean>>({});
  protected readonly navTree = this.content.navigationTree;
  protected readonly navSections = computed(() => {
    const sections = new Map<string, { key: string; title: string; nodes: NavigationNode[] }>();

    for (const node of this.navTree()) {
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

  constructor() {
    void this.content.ensureNavigationLoaded();
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected toggleSection(sectionKey: string): void {
    this.expandedSections.update((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey]
    }));
  }

  protected isSectionExpanded(sectionKey: string): boolean {
    const expanded = this.expandedSections();
    return expanded[sectionKey] ?? true;
  }

  protected lessonLink(node: NavigationNode): string {
    return `/${node.slug}`;
  }

  private humanizeSection(section: string): string {
    return section
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
