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
import { SchoolContentService } from '../data/school-content.service';

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
                <section class="lesson__project-tree" aria-label="Árvore da estrutura do projeto">
                  @for (node of projectTree(); track node.id) {
                    <ng-container
                      [ngTemplateOutlet]="treeNode"
                      [ngTemplateOutletContext]="{ $implicit: node, level: 0 }"
                    />
                  }
                </section>
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

    <ng-template #treeNode let-node let-level="level">
      <div class="project-tree__node" [style.--tree-level]="level">
        @if (hasChildren(node)) {
          <button
            class="project-tree__trigger"
            type="button"
            (click)="toggleTreeNode(node.id)"
            [attr.aria-expanded]="isTreeNodeExpanded(node.id)"
          >
            <span class="project-tree__chevron">
              {{ isTreeNodeExpanded(node.id) ? '−' : '+' }}
            </span>
            <span class="project-tree__label">{{ node.label }}</span>
          </button>
        } @else {
          <div class="project-tree__leaf">
            <span class="project-tree__dot" aria-hidden="true"></span>
            <span class="project-tree__label">{{ node.label }}</span>
          </div>
        }
      </div>

      @if (hasChildren(node) && isTreeNodeExpanded(node.id)) {
        <div class="project-tree__children">
          @for (child of node.children; track child.id) {
            <ng-container
              [ngTemplateOutlet]="treeNode"
              [ngTemplateOutletContext]="{ $implicit: child, level: level + 1 }"
            />
          }
        </div>
      }
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
        gap: 8px;
        margin-top: 18px;
        padding: 18px;
        border: 1px solid var(--fd-border);
        background:
          linear-gradient(180deg, rgba(178, 45, 0, 0.08), transparent 32%),
          rgba(255, 255, 255, 0.015);
      }

      .project-tree__node {
        --tree-indent: calc(var(--tree-level, 0) * 18px);
        padding-left: var(--tree-indent);
      }

      .project-tree__trigger,
      .project-tree__leaf {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 38px;
        padding: 0 10px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--fd-text);
        text-align: left;
      }

      .project-tree__trigger {
        cursor: pointer;
      }

      .project-tree__trigger:hover {
        border-color: var(--fd-border);
        background: rgba(255, 255, 255, 0.03);
      }

      .project-tree__chevron {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border: 1px solid var(--fd-border);
        color: var(--fd-accent);
        font-size: 16px;
        font-weight: 700;
        line-height: 1;
      }

      .project-tree__dot {
        width: 8px;
        height: 8px;
        background: var(--fd-accent);
        border-radius: 999px;
        box-shadow: 0 0 12px rgba(178, 45, 0, 0.28);
      }

      .project-tree__label {
        color: var(--fd-text);
        font-size: var(--fd-text-sm);
        line-height: 1.4;
      }

      .project-tree__children {
        display: grid;
        gap: 6px;
        margin-top: 6px;
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
  private readonly treeStorageKey = 'fulldev-school.project-tree.expanded-nodes';
  protected readonly content = inject(SchoolContentService);
  protected readonly expandedBlocks = signal<Record<string, boolean>>(this.readExpandedBlocks());
  protected readonly expandedTreeNodes = signal<Record<string, boolean>>(this.readExpandedTreeNodes());
  protected readonly projectTree = signal<ProjectTreeNode[]>([
    {
      id: 'tecnologia',
      label: 'Tecnologia',
      children: [
        {
          id: 'programacao',
          label: 'Programação',
          children: [
            {
              id: 'frontend',
              label: 'Frontend',
              children: [
                { id: 'html-css-js', label: 'HTML, CSS e JavaScript' },
                { id: 'react', label: 'React' },
                { id: 'angular', label: 'Angular' },
                { id: 'nextjs', label: 'Next.js' }
              ]
            },
            {
              id: 'backend',
              label: 'Backend',
              children: [
                { id: 'csharp', label: 'C#' },
                { id: 'python', label: 'Python' },
                { id: 'nodejs', label: 'Node.js' }
              ]
            },
            {
              id: 'dados',
              label: 'Dados',
              children: [
                { id: 'sql', label: 'SQL' },
                { id: 'python-dados', label: 'Python para dados' },
                { id: 'bi-analise', label: 'BI e análise' }
              ]
            }
          ]
        },
        {
          id: 'fundamentos',
          label: 'Fundamentos',
          children: [
            { id: 'base-digital', label: 'Base digital' },
            { id: 'internet-web', label: 'Internet e web' },
            { id: 'logica-estrutura', label: 'Lógica e estrutura' }
          ]
        },
        {
          id: 'carreira',
          label: 'Carreira',
          children: [
            { id: 'escolha-trilha', label: 'Escolha de trilha' },
            { id: 'projetos-portfolio', label: 'Projetos e portfólio' },
            { id: 'mercado-trabalho', label: 'Mercado de trabalho' },
            { id: 'comunidade-networking', label: 'Comunidade e networking' }
          ]
        },
        {
          id: 'apoio',
          label: 'Apoio',
          children: [
            { id: 'faq', label: 'FAQ' },
            { id: 'glossario', label: 'Glossário' },
            { id: 'recursos-curados', label: 'Recursos curados' },
            { id: 'bibliografia', label: 'Bibliografia' }
          ]
        }
      ]
    }
  ]);

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

  protected isTreeNodeExpanded(nodeId: string): boolean {
    return this.expandedTreeNodes()[nodeId] ?? true;
  }

  protected toggleTreeNode(nodeId: string): void {
    this.expandedTreeNodes.update((current) => {
      const next = {
        ...current,
        [nodeId]: !(current[nodeId] ?? true)
      };

      this.writeExpandedTreeNodes(next);
      return next;
    });
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

  private readExpandedTreeNodes(): Record<string, boolean> {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(this.treeStorageKey);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }

  private writeExpandedTreeNodes(state: Record<string, boolean>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.treeStorageKey, JSON.stringify(state));
    } catch {
      // Ignore storage failures and keep the current in-memory state.
    }
  }
}
