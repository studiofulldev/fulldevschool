import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { NavigationNode, SchoolContentService } from '../data/school-content.service';

interface ProjectTreeNode {
  id: string;
  label: string;
  children?: ProjectTreeNode[];
}

@Component({
  selector: 'app-lesson-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatExpansionModule, MatIconModule],
  template: `
    @if (lesson(); as currentLesson) {
      <section class="lesson">
        <header class="lesson__hero">
          <div>
            <span class="lesson__eyebrow">Fulldev School</span>
            <h1>{{ currentLesson.meta.title }}</h1>
            <div class="lesson__meta">
              <span>{{ topicCount() }} tópicos</span>
              <span>{{ videoCountLabel() }}</span>
              <span>{{ readingTime() }} min de leitura</span>
            </div>
          </div>
        </header>

        <nav class="lesson__breadcrumbs">
          <a routerLink="/">Fulldev School</a>
          <span>/</span>
          <span>{{ currentLesson.meta.title }}</span>
        </nav>

        <article class="lesson__body">
          @if (shouldShowWelcomePanel()) {
            <mat-expansion-panel class="lesson__block" hideToggle [expanded]="true">
              <mat-expansion-panel-header class="lesson__block-header">
                <mat-panel-title>
                  <span class="lesson__block-accent" aria-hidden="true"></span>
                  <span>Boas-vindas</span>
                </mat-panel-title>
                <mat-icon class="lesson__block-icon">expand_more</mat-icon>
              </mat-expansion-panel-header>

              <section class="lesson__video-slot" aria-label="Espaço para vídeo de apresentação do projeto">
                <div class="lesson__video-frame">
                  <div class="lesson__video-placeholder">
                    <mat-icon>play_circle</mat-icon>
                  </div>
                </div>

                <div class="lesson__video-copy">
                  <strong>Vídeo de apresentação do projeto</strong>
                  <p>
                    Aqui entra o vídeo principal de introdução, com a visão geral da proposta,
                    da estrutura e do objetivo da Fulldev School.
                  </p>
                </div>
              </section>
            </mat-expansion-panel>
          }

          @for (block of currentLesson.blocks; track block.id) {
            <mat-expansion-panel
              class="lesson__block"
              hideToggle
              [expanded]="isBlockExpanded(currentLesson.meta.slug, block.id)"
              (opened)="setBlockExpanded(currentLesson.meta.slug, block.id, true)"
              (closed)="setBlockExpanded(currentLesson.meta.slug, block.id, false)"
              >
              <mat-expansion-panel-header class="lesson__block-header">
                <mat-panel-title>
                  <span class="lesson__block-accent" aria-hidden="true"></span>
                  <span>{{ block.title }}</span>
                </mat-panel-title>
                <mat-icon class="lesson__block-icon">expand_more</mat-icon>
              </mat-expansion-panel-header>

              <div class="lesson__block-body" [innerHTML]="blockHtml(block.id)"></div>

              @if (shouldShowProjectTree(block.title)) {
                @if (projectTree(); as tree) {
                  <section class="lesson__project-tree" aria-label="Estrutura do conteúdo do projeto">
                    <header class="project-tree__header">
                      <span class="project-tree__eyebrow">Estrutura real do conteúdo</span>
                      <strong class="project-tree__root-label">{{ tree.label }}</strong>
                    </header>

                    @if (projectFlowRoot(); as rootSection) {
                      <div class="project-tree__flow">
                        <section class="project-tree__root-card">
                          <h3 class="project-tree__column-title">{{ rootSection.label }}</h3>

                          @if (rootSection.children?.length) {
                            <ng-container
                              [ngTemplateOutlet]="treeBranch"
                              [ngTemplateOutletContext]="{ $implicit: rootSection.children, depth: 0 }"
                            />
                          }
                        </section>

                        <div class="project-tree__root-connector" aria-hidden="true">
                          <span class="project-tree__connector-line"></span>
                          <mat-icon>south</mat-icon>
                        </div>
                      </div>
                    }

                    <div class="project-tree__columns">
                      @for (column of projectFlowStages(); track column.id; let last = $last) {
                        <div class="project-tree__stage">
                          <section class="project-tree__column">
                            <h3 class="project-tree__column-title">{{ column.label }}</h3>

                            @if (column.children?.length) {
                              <ng-container
                                [ngTemplateOutlet]="treeBranch"
                                [ngTemplateOutletContext]="{ $implicit: column.children, depth: 0 }"
                              />
                            }
                          </section>

                          @if (!last) {
                            <div class="project-tree__stage-arrow" aria-hidden="true">
                              <span class="project-tree__connector-line"></span>
                              <mat-icon>east</mat-icon>
                              <span class="project-tree__connector-line"></span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </section>
                }
              }

              @if (shouldShowVideoSlot(block.title)) {
                <section class="lesson__video-slot" aria-label="Espaço para vídeo complementar do tópico">
                  <div class="lesson__video-frame">
                    <div class="lesson__video-placeholder">
                      <mat-icon>play_circle</mat-icon>
                    </div>
                  </div>

                  <div class="lesson__video-copy">
                    <strong>Vídeo complementar do tópico</strong>
                    <p>
                      Aqui entra o vídeo de apoio deste bloco, reforçando o conteúdo principal
                      com uma explicação prática ou visual.
                    </p>
                  </div>
                </section>
              }
            </mat-expansion-panel>
          }
        </article>

        <footer class="lesson__footer-nav">
          @if (content.previousLesson(); as previous) {
            <a mat-stroked-button class="lesson__nav-button lesson__nav-button--previous" [routerLink]="['/', previous.slug]">
              <mat-icon>arrow_back</mat-icon>
              {{ previous.title }}
            </a>
          }

          @if (content.nextLesson(); as next) {
            <a mat-flat-button class="lesson__nav-button lesson__nav-button--next" [routerLink]="['/', next.slug]">
              {{ next.title }}
              <mat-icon>arrow_forward</mat-icon>
            </a>
          }
        </footer>
      </section>
    } @else {
      <section class="lesson lesson--loading" aria-label="Carregando conteúdo">
        <div class="lesson__skeleton lesson__skeleton--hero"></div>
        <div class="lesson__skeleton lesson__skeleton--breadcrumbs"></div>
        <div class="lesson__skeleton lesson__skeleton--body"></div>
        <div class="lesson__skeleton lesson__skeleton--body"></div>
      </section>
    }

    <ng-template #treeBranch let-nodes let-depth="depth">
      <div class="project-tree__branch" [style.--branch-depth]="depth">
        @for (node of nodes; track node.id) {
          <div class="project-tree__item" [class.project-tree__item--group]="hasChildren(node)">
            <div class="project-tree__item-label">{{ node.label }}</div>

            @if (hasChildren(node)) {
              <ng-container
                [ngTemplateOutlet]="treeBranch"
                [ngTemplateOutletContext]="{ $implicit: node.children, depth: depth + 1 }"
              />
            }
          </div>
        }
      </div>
    </ng-template>
  `,
  styles: [
    `
      .lesson {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: var(--fd-content-width);
        margin: 0 auto;
        font-family: var(--fd-font-family);
      }

      .lesson__hero {
        display: grid;
        gap: 20px;
        padding: 24px;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .lesson__eyebrow {
        display: inline-block;
        margin-bottom: 12px;
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .lesson__hero h1 {
        margin: 0 0 8px;
        font-size: clamp(var(--fd-text-xl), 4.8vw, 4rem);
        line-height: 0.98;
        letter-spacing: -0.03em;
      }

      .lesson__breadcrumbs {
        display: flex;
        gap: 10px;
        padding: 0 6px;
        color: var(--fd-soft);
        font-size: var(--fd-text-sm);
      }

      .lesson__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }

      .lesson__meta span {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        padding: 0 10px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.03);
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 600;
      }

      .lesson__breadcrumbs a {
        color: inherit;
        text-decoration: none;
      }

      .lesson__body {
        display: grid;
        gap: 12px;
        padding: 32px;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .lesson__block {
        background: transparent;
        box-shadow: none;
        border: 0;
        border-radius: var(--fd-radius);
      }

      .lesson__block-header {
        min-height: 56px;
        padding: 0 10px;
        background: transparent;
      }

      .lesson__block-header mat-panel-title {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--fd-text);
        font-size: var(--fd-text-lg);
        font-weight: 600;
        line-height: 1.25;
      }

      .lesson__block-accent {
        flex: 0 0 4px;
        align-self: stretch;
        min-height: 24px;
        border-radius: 999px;
        background: var(--fd-accent);
        box-shadow: 0 0 12px rgba(178, 45, 0, 0.28);
      }

      .lesson__block-icon {
        color: var(--fd-soft);
        transition: transform var(--fd-motion-fast);
      }

      :host ::ng-deep .lesson__block.mat-expanded .lesson__block-icon {
        transform: rotate(180deg);
      }

      :host ::ng-deep .lesson__block .mat-expansion-panel-body {
        padding: 0 10px 18px;
      }

      .lesson__block-body {
        padding-top: 4px;
      }

      .lesson__video-slot {
        display: grid;
        gap: 14px;
        margin: 10px 10px 0;
        padding: 16px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.02);
      }

      .lesson__video-frame {
        position: relative;
        overflow: hidden;
        aspect-ratio: 16 / 9;
        border: 1px dashed rgba(178, 45, 0, 0.5);
        background:
          linear-gradient(180deg, rgba(178, 45, 0, 0.12), rgba(17, 17, 17, 0.28)),
          rgba(255, 255, 255, 0.02);
      }

      .lesson__video-placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .lesson__video-placeholder mat-icon {
        width: 56px;
        height: 56px;
        font-size: 56px;
        color: var(--fd-accent);
      }

      .lesson__video-copy {
        display: grid;
        gap: 6px;
      }

      .lesson__video-copy strong {
        color: var(--fd-text);
        font-size: var(--fd-text-sm);
      }

      .lesson__video-copy p {
        margin: 0;
        color: var(--fd-muted);
        font-size: var(--fd-text-sm);
        line-height: 1.7;
      }

      .lesson__project-tree {
        display: grid;
        gap: 18px;
        margin-top: 18px;
        padding: 18px;
        border: 1px solid var(--fd-border);
        background:
          linear-gradient(180deg, rgba(178, 45, 0, 0.08), transparent 32%),
          rgba(255, 255, 255, 0.015);
      }

      .project-tree__header {
        display: grid;
        gap: 4px;
      }

      .project-tree__eyebrow {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .project-tree__root-label {
        color: var(--fd-text);
        font-size: var(--fd-text-lg);
        line-height: 1.2;
      }

      .project-tree__flow {
        display: grid;
        justify-items: center;
        gap: 10px;
      }

      .project-tree__root-card {
        display: grid;
        gap: 12px;
        width: min(100%, 360px);
        padding: 16px;
        border: 1px solid rgba(178, 45, 0, 0.35);
        background: linear-gradient(180deg, rgba(178, 45, 0, 0.12), rgba(255, 255, 255, 0.03));
      }

      .project-tree__root-connector,
      .project-tree__stage-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--fd-accent);
      }

      .project-tree__root-connector {
        flex-direction: column;
      }

      .project-tree__connector-line {
        display: block;
        width: 1px;
        height: 18px;
        background: rgba(178, 45, 0, 0.45);
      }

      .project-tree__columns {
        display: flex;
        align-items: stretch;
        gap: 14px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: thin;
      }

      .project-tree__stage {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .project-tree__column {
        display: grid;
        align-content: start;
        gap: 12px;
        min-width: 240px;
        padding: 14px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.025);
      }

      .project-tree__column-title {
        margin: 0;
        color: var(--fd-text);
        font-size: var(--fd-text-md);
        line-height: 1.25;
      }

      .project-tree__stage-arrow .project-tree__connector-line {
        width: 16px;
        height: 1px;
      }

      .project-tree__branch {
        display: grid;
        gap: 10px;
      }

      .project-tree__item {
        display: grid;
        gap: 10px;
        padding-left: calc(var(--branch-depth, 0) * 12px);
      }

      .project-tree__item--group > .project-tree__item-label {
        border-color: rgba(178, 45, 0, 0.35);
        background: rgba(178, 45, 0, 0.08);
        color: var(--fd-text);
      }

      .project-tree__item-label {
        padding: 10px 12px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.03);
        color: var(--fd-muted);
        font-size: var(--fd-text-sm);
        line-height: 1.45;
      }

      :host ::ng-deep .lesson__block .mat-expansion-panel-header:hover,
      :host ::ng-deep .lesson__block .mat-expansion-panel-header:focus,
      :host ::ng-deep .lesson__block .mat-expansion-panel-header.mat-expanded {
        background: transparent;
      }

      .lesson__footer-nav {
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }

      .lesson__nav-button {
        min-height: 44px;
        padding-inline: 18px;
        border-radius: var(--fd-radius);
        font-weight: 600;
      }

      .lesson__nav-button--previous {
        border-color: var(--fd-border-strong) !important;
        color: var(--fd-text) !important;
        background: transparent !important;
      }

      .lesson__nav-button--previous:hover {
        border-color: var(--fd-accent) !important;
        color: var(--fd-white) !important;
        background: var(--fd-accent-fade) !important;
      }

      .lesson__nav-button--next {
        border: 1px solid var(--fd-accent) !important;
        color: var(--fd-white) !important;
        background: var(--fd-accent) !important;
        box-shadow: none !important;
      }

      .lesson__nav-button--next:hover {
        border-color: var(--fd-accent-strong) !important;
        background: var(--fd-accent-strong) !important;
      }

      .lesson--loading {
        min-height: 50vh;
      }

      .lesson__skeleton {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .lesson__skeleton::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
        animation: lesson-skeleton 1.25s ease infinite;
      }

      .lesson__skeleton--hero {
        min-height: 180px;
      }

      .lesson__skeleton--breadcrumbs {
        min-height: 28px;
      }

      .lesson__skeleton--body {
        min-height: 220px;
      }

      @keyframes lesson-skeleton {
        100% {
          transform: translateX(100%);
        }
      }

      :host ::ng-deep .lesson__block-body p,
      :host ::ng-deep .lesson__block-body li {
        color: var(--fd-muted);
        font-size: var(--fd-text-md);
        line-height: var(--fd-leading-loose);
      }

      :host ::ng-deep .lesson__block-body ul,
      :host ::ng-deep .lesson__block-body ol {
        padding-left: 1.3rem;
      }

      :host ::ng-deep .lesson__block-body h3 {
        margin: 18px 0 10px;
        color: var(--fd-text);
        font-size: var(--fd-text-md);
        line-height: 1.25;
      }

      :host ::ng-deep .lesson__block-body strong {
        color: var(--fd-text);
      }

      :host ::ng-deep .lesson__block-body code {
        padding: 0.12rem 0.35rem;
        background: rgba(255, 255, 255, 0.06);
        color: var(--fd-text);
      }

      :host ::ng-deep .lesson__block-body a {
        color: var(--fd-text);
        text-decoration: underline;
        text-decoration-color: rgba(255, 255, 255, 0.22);
      }

      :host ::ng-deep .lesson__block-body table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
      }

      :host ::ng-deep .lesson__block-body th,
      :host ::ng-deep .lesson__block-body td {
        padding: 12px;
        border: 1px solid var(--fd-border);
        text-align: left;
        vertical-align: top;
        color: var(--fd-muted);
        font-size: var(--fd-text-sm);
      }

      :host ::ng-deep .lesson__block-body th {
        color: var(--fd-text);
        background: rgba(255, 255, 255, 0.03);
      }

      @media (max-width: 960px) {
        .lesson__block-header mat-panel-title {
          gap: 10px;
        }

        .project-tree__columns {
          gap: 10px;
        }

        .project-tree__stage {
          gap: 10px;
        }

        .project-tree__column,
        .project-tree__root-card {
          min-width: min(220px, 82vw);
        }

        .lesson__footer-nav {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LessonPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly blockStorageKey = 'fulldev-school.lesson.expanded-blocks';
  private readonly hiddenProjectSections = new Set(['16-painel-de-progresso', '90-templates']);
  protected readonly content = inject(SchoolContentService);
  protected readonly expandedBlocks = signal<Record<string, boolean>>(this.readExpandedBlocks());
  protected readonly projectTree = computed(() => this.buildProjectTree());
  protected readonly projectFlowRoot = computed(() => this.projectTree().children?.[0] ?? null);
  protected readonly projectFlowStages = computed(() => this.projectTree().children?.slice(1) ?? []);

  private readonly lessonResult = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug');
        return from(this.resolveLesson(slug));
      })
    ),
    { initialValue: null }
  );

  protected readonly lesson = computed(() => this.lessonResult());
  protected readonly topicCount = computed(() => this.lesson()?.blocks.length ?? 0);
  protected readonly videoCount = computed(() => {
    const lesson = this.lesson();
    if (!lesson) {
      return 0;
    }

    const blockVideoCount = lesson.blocks.filter((block) => this.shouldShowVideoSlot(block.title)).length;
    return blockVideoCount + (this.shouldShowWelcomePanel() ? 1 : 0);
  });
  protected readonly videoCountLabel = computed(() => {
    const count = this.videoCount();
    return `${count} vídeo${count === 1 ? '' : 's'}`;
  });
  protected readonly readingTime = computed(() => {
    const markdown = this.lesson()?.markdown ?? '';
    const words = markdown
      .replace(/[#>*`\-\[\]\(\)\|]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return Math.max(1, Math.ceil(words / 200));
  });

  private async resolveLesson(slug: string | null) {
    if (slug) {
      return this.content.loadLessonBySlug(slug);
    }

    await this.content.ensureNavigationLoaded();
    const initialSlug = this.content.navigationTree()[0]?.slug;
    return initialSlug ? this.content.loadLessonBySlug(initialSlug) : null;
  }

  protected blockHtml(blockId: string): SafeHtml {
    const block = this.lesson()?.blocks.find((item) => item.id === blockId);
    return this.sanitizer.bypassSecurityTrustHtml(block?.html ?? '');
  }

  protected shouldShowWelcomePanel(): boolean {
    const currentLesson = this.lesson();
    const firstLesson = this.content.navigationTree()[0];

    if (!currentLesson || !firstLesson) {
      return false;
    }

    return currentLesson.meta.slug === firstLesson.slug;
  }

  protected shouldShowProjectTree(blockTitle: string): boolean {
    return this.shouldShowWelcomePanel() && blockTitle.trim().toLowerCase() === 'estrutura do projeto';
  }

  protected shouldShowVideoSlot(blockTitle: string): boolean {
    if (this.shouldShowWelcomePanel()) {
      return false;
    }

    const normalizedTitle = this.normalizeTitle(blockTitle);
    const excludedTitles = new Set([
      'visao-geral',
      'proxima-acao-pratica',
      'referencias-por-topico-e-videos-sugeridos',
      'topicos-do-roadmap-e-videos-sugeridos',
      'verificacao-por-topico',
      'bibliografia'
    ]);

    return !excludedTitles.has(normalizedTitle);
  }

  protected hasChildren(node: ProjectTreeNode): boolean {
    return Boolean(node.children?.length);
  }

  protected isBlockExpanded(slug: string, blockId: string): boolean {
    const key = this.blockStateKey(slug, blockId);
    return this.expandedBlocks()[key] ?? true;
  }

  protected setBlockExpanded(slug: string, blockId: string, expanded: boolean): void {
    this.expandedBlocks.update((current) => {
      const next = {
        ...current,
        [this.blockStateKey(slug, blockId)]: expanded
      };

      this.writeExpandedBlocks(next);
      return next;
    });
  }

  private blockStateKey(slug: string, blockId: string): string {
    return `${slug}::${blockId}`;
  }

  private normalizeTitle(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private buildProjectTree(): ProjectTreeNode {
    const root: ProjectTreeNode = {
      id: 'fulldev-school',
      label: 'Fulldev School',
      children: []
    };

    for (const node of this.content.navigationTree()) {
      if (this.hiddenProjectSections.has(node.section)) {
        continue;
      }

      const sectionNode = this.getOrCreateChild(
        root,
        `section-${node.section}`,
        node.sectionTitle ?? this.humanizeLabel(node.section)
      );
      const pathSegments = this.projectPathSegments(node);
      let currentNode = sectionNode;

      for (const segment of pathSegments.slice(0, -1)) {
        currentNode = this.getOrCreateChild(
          currentNode,
          `${currentNode.id}::${this.normalizeTitle(segment)}`,
          segment
        );
      }

      const leafLabel = pathSegments[pathSegments.length - 1] ?? node.title;
      this.getOrCreateChild(currentNode, node.id, leafLabel);
    }

    return root;
  }

  private getOrCreateChild(parent: ProjectTreeNode, id: string, label: string): ProjectTreeNode {
    const children = (parent.children ??= []);
    const existing = children.find((child) => child.id === id);
    if (existing) {
      return existing;
    }

    const created: ProjectTreeNode = { id, label, children: [] };
    children.push(created);
    return created;
  }

  private projectPathSegments(node: NavigationNode): string[] {
    const rawLabel = node.navTitle || node.title;
    return rawLabel
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);
  }

  private humanizeLabel(value: string): string {
    return value
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private readExpandedBlocks(): Record<string, boolean> {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(this.blockStorageKey);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  private writeExpandedBlocks(state: Record<string, boolean>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.blockStorageKey, JSON.stringify(state));
    } catch {
      // Ignore storage failures and keep the current in-memory state.
    }
  }

}
