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

interface ContentSupporter {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  initials: string;
  socials: Array<{
    label: string;
    url: string;
    icon: string;
  }>;
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

        <section class="lesson__top-nav-shell">
          <nav class="lesson__top-nav" aria-label="Navegação entre conteúdos">
            @if (content.previousLesson(); as previous) {
              <a class="lesson__top-nav-link" [routerLink]="['/', previous.slug]">
                <mat-icon>arrow_back</mat-icon>
                <span>Anterior</span>
              </a>
            } @else {
              <span></span>
            }

            @if (content.nextLesson(); as next) {
              <a class="lesson__top-nav-link lesson__top-nav-link--next" [routerLink]="['/', next.slug]">
                <span>Próximo</span>
                <mat-icon>arrow_forward</mat-icon>
              </a>
            }
          </nav>
        </section>

        <article class="lesson__body">
          @if (shouldShowWelcomePanel()) {
            <mat-expansion-panel class="lesson__block" hideToggle [expanded]="currentLesson.meta.slug === 'visao-geral-do-guia'">
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
              [expanded]="isBlockExpanded(currentLesson.meta.slug, block.id, block.title)"
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

                    <div class="project-tree__flow">
                      @for (section of tree.children ?? []; track section.id; let last = $last) {
                        <section
                          class="project-tree__stage-card"
                          [class.project-tree__stage-card--fit]="shouldRenderProjectChildrenHorizontally(section)"
                        >
                          <h3 class="project-tree__column-title">{{ section.label }}</h3>

                          @if (section.children?.length) {
                            <ng-container
                              [ngTemplateOutlet]="shouldRenderProjectChildrenHorizontally(section) ? treeBranchHorizontal : treeBranch"
                              [ngTemplateOutletContext]="{ $implicit: section.children, depth: 0 }"
                            />
                          }
                        </section>

                        @if (!last) {
                          <div class="project-tree__root-connector" aria-hidden="true">
                            <span class="project-tree__connector-line"></span>
                            <mat-icon>south</mat-icon>
                          </div>
                        }
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

          <mat-expansion-panel class="lesson__block" hideToggle [expanded]="false">
            <mat-expansion-panel-header class="lesson__block-header">
              <mat-panel-title>
                <span class="lesson__block-accent" aria-hidden="true"></span>
                <span>Apoio de conteúdo</span>
              </mat-panel-title>
              <mat-icon class="lesson__block-icon">expand_more</mat-icon>
            </mat-expansion-panel-header>

            <section class="lesson__supporters" aria-label="Contribuidores de apoio de conteúdo">
              @for (supporter of contentSupporters; track supporter.id) {
                <article class="supporter-card">
                  <div class="supporter-card__media">
                    @if (supporter.imageUrl) {
                      <img [src]="supporter.imageUrl" [alt]="supporter.name" />
                    } @else {
                      <div class="supporter-card__avatar" aria-hidden="true">{{ supporter.initials }}</div>
                    }
                  </div>

                  <div class="supporter-card__body">
                    <strong>{{ supporter.name }}</strong>
                    <span>{{ supporter.role }}</span>
                  </div>

                  <div class="supporter-card__socials" aria-label="Redes sociais">
                    @for (social of supporter.socials; track social.url) {
                      <a
                        class="supporter-card__social"
                        [href]="social.url"
                        target="_blank"
                        rel="noreferrer"
                        [attr.aria-label]="social.label"
                        [title]="social.label"
                      >
                        <mat-icon>{{ social.icon }}</mat-icon>
                      </a>
                    }
                  </div>
                </article>
              }
            </section>
          </mat-expansion-panel>
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
            @if (hasChildren(node)) {
              <button
                type="button"
                class="project-tree__item-label project-tree__item-toggle"
                (click)="toggleTreeNode(node.id)"
                [attr.aria-expanded]="isTreeNodeExpanded(node.id)"
              >
                <span>{{ node.label }}</span>
                <mat-icon>{{ isTreeNodeExpanded(node.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
            } @else {
              <div class="project-tree__item-label">{{ node.label }}</div>
            }

            @if (hasChildren(node) && isTreeNodeExpanded(node.id)) {
              <ng-container
                [ngTemplateOutlet]="treeBranch"
                [ngTemplateOutletContext]="{ $implicit: node.children, depth: depth + 1 }"
              />
            }
          </div>
        }
      </div>
    </ng-template>

    <ng-template #treeBranchHorizontal let-nodes let-depth="depth">
      <div class="project-tree__branch-horizontal" [style.--branch-depth]="depth">
        @for (node of nodes; track node.id) {
          <div class="project-tree__item project-tree__item--horizontal" [class.project-tree__item--group]="hasChildren(node)">
            @if (hasChildren(node)) {
              <button
                type="button"
                class="project-tree__item-label project-tree__item-toggle"
                (click)="toggleTreeNode(node.id)"
                [attr.aria-expanded]="isTreeNodeExpanded(node.id)"
              >
                <span>{{ node.label }}</span>
                <mat-icon>{{ isTreeNodeExpanded(node.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
            } @else {
              <div class="project-tree__item-label">{{ node.label }}</div>
            }

            @if (hasChildren(node) && isTreeNodeExpanded(node.id)) {
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

      .lesson__top-nav-shell {
        display: grid;
        gap: 12px;
        padding: 16px 20px;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .lesson__top-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        width: 100%;
        padding: 0;
      }

      .lesson__top-nav-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 28px;
        padding: 0;
        background: transparent;
        color: var(--fd-soft);
        font-size: 0.62rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        line-height: 1.2;
        text-decoration: none;
        white-space: nowrap;
        opacity: 1;
        transition:
          color var(--fd-motion-fast);
      }

      .lesson__top-nav-link:hover {
        color: var(--fd-text);
      }

      .lesson__top-nav-link--next {
        margin-left: auto;
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

      .lesson__supporters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
        margin: 10px 10px 0;
      }

      .supporter-card {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 14px;
        padding: 14px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.02);
      }

      .supporter-card__media {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .supporter-card__media img,
      .supporter-card__avatar {
        width: 52px;
        height: 52px;
        border-radius: 999px;
      }

      .supporter-card__media img {
        display: block;
        object-fit: cover;
      }

      .supporter-card__avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(178, 45, 0, 0.16);
        color: var(--fd-text);
        font-size: var(--fd-text-sm);
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .supporter-card__body {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .supporter-card__body strong {
        color: var(--fd-text);
        font-size: var(--fd-text-sm);
        line-height: 1.3;
      }

      .supporter-card__body span {
        color: var(--fd-muted);
        font-size: var(--fd-text-xs);
        line-height: 1.4;
      }

      .supporter-card__socials {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .supporter-card__social {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border: 1px solid var(--fd-border);
        color: var(--fd-soft);
        text-decoration: none;
        transition:
          border-color var(--fd-motion-fast),
          color var(--fd-motion-fast),
          background var(--fd-motion-fast);
      }

      .supporter-card__social:hover {
        border-color: var(--fd-accent);
        background: rgba(178, 45, 0, 0.12);
        color: var(--fd-text);
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
        align-items: start;
        gap: 12px;
      }

      .project-tree__stage-card {
        display: grid;
        gap: 12px;
        width: min(100%, 360px);
        padding: 16px;
        border: 1px solid rgba(178, 45, 0, 0.35);
        background: linear-gradient(180deg, rgba(178, 45, 0, 0.12), rgba(255, 255, 255, 0.03));
      }

      .project-tree__stage-card--fit {
        width: fit-content;
        max-width: 100%;
      }

      .project-tree__root-connector {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--fd-accent);
      }

      .project-tree__connector-line {
        display: block;
        width: 1px;
        height: 18px;
        background: rgba(178, 45, 0, 0.45);
      }

      .project-tree__column {
        display: grid;
        align-content: start;
        gap: 12px;
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

      .project-tree__branch {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        width: 100%;
      }

      .project-tree__branch-horizontal {
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: thin;
      }

      .project-tree__item,
      .project-tree__item--horizontal {
        display: grid;
        gap: 10px;
        width: 100%;
        min-width: 220px;
        padding-left: 0;
      }

      .project-tree__item {
        justify-items: start;
      }

      .project-tree__item--horizontal {
        align-content: start;
        justify-items: stretch;
        align-self: flex-start;
      }

      .project-tree__item--horizontal > .project-tree__branch {
        width: 100%;
        min-width: 220px;
      }

      .project-tree__item--horizontal > .project-tree__item-label {
        justify-content: flex-start;
        text-align: left;
      }

      .project-tree__item--group > .project-tree__item-label {
        border-color: rgba(178, 45, 0, 0.35);
        background: rgba(178, 45, 0, 0.08);
        color: var(--fd-text);
      }

      .project-tree__item-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-width: 220px;
        height: 52px;
        box-sizing: border-box;
        padding: 10px 12px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.03);
        color: var(--fd-muted);
        font-size: var(--fd-text-sm);
        line-height: 1.45;
      }

      .project-tree__item-toggle {
        cursor: pointer;
      }

      .lesson__top-nav-link mat-icon,
      .project-tree__item-toggle mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }

      .project-tree__item-toggle mat-icon {
        color: var(--fd-soft);
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
        .lesson__top-nav-shell {
          padding: 12px 16px;
        }

        .supporter-card {
          grid-template-columns: auto 1fr;
        }

        .supporter-card__socials {
          grid-column: 1 / -1;
        }

        .lesson__block-header mat-panel-title {
          gap: 10px;
        }

        .project-tree__column,
        .project-tree__stage-card {
          min-width: min(220px, 82vw);
        }

        .project-tree__item--horizontal {
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
  private readonly treeStorageKey = 'fulldev-school.project-tree.expanded-nodes';
  private readonly hiddenProjectSections = new Set(['16-painel-de-progresso', '90-templates']);
  protected readonly content = inject(SchoolContentService);
  protected readonly contentSupporters: ContentSupporter[] = [
    {
      id: 'fulldev',
      name: 'FullDev',
      role: 'Comunidade e curadoria editorial',
      initials: 'FD',
      socials: [
        { label: 'Comunidade FullDev', url: 'https://fulldev.com.br', icon: 'groups' },
        { label: 'Site FullDev', url: 'https://fulldev.com.br', icon: 'language' }
      ]
    },
    {
      id: 'mayk-brito',
      name: 'Mayk Brito',
      role: 'Educador e criador de conteúdo',
      initials: 'MB',
      socials: [
        { label: 'YouTube', url: 'https://www.youtube.com/watch?ab_channel=MaykBrito&v=K65wUN-2no4', icon: 'smart_display' }
      ]
    },
    {
      id: 'glaucia-lemos',
      name: 'Glaucia Lemos',
      role: 'Educadora e especialista em desenvolvimento',
      initials: 'GL',
      socials: [
        { label: 'YouTube', url: 'https://www.youtube.com/watch?ab_channel=GlauciaLemos&list=PLb2HQ45KP0Wsk-p_0c6ImqBAEFEY-LU9H&v=u7K1sdnCv5Y', icon: 'smart_display' }
      ]
    },
    {
      id: 'joao-ribeiro',
      name: 'João Ribeiro',
      role: 'Professor e criador de conteúdo',
      initials: 'JR',
      socials: [
        { label: 'YouTube', url: 'https://www.youtube.com/watch?ab_channel=Jo%C3%A3oRibeiro&list=PLXik_5Br-zO9SEz-3tuy1UIcU6X0GZo4i&v=DF9jY0ITt3Q', icon: 'smart_display' }
      ]
    },
    {
      id: 'fernanda-kipper',
      name: 'Fernanda Kipper',
      role: 'Educadora e criadora de cursos',
      initials: 'FK',
      socials: [
        { label: 'Site', url: 'https://fernandakipper.com/cursos/typescript-para-iniciantes-sintaxe-basica-conceitos-fundamentais', icon: 'language' }
      ]
    },
    {
      id: 'matheus-battisti',
      name: 'Matheus Battisti',
      role: 'Educador e criador de conteúdo',
      initials: 'MB',
      socials: [
        { label: 'YouTube', url: 'https://www.youtube.com/watch?ab_channel=MatheusBattisti-HoradeCodar&t=1s&v=np_vyd7QlXk', icon: 'smart_display' }
      ]
    }
  ];
  protected readonly expandedBlocks = signal<Record<string, boolean>>(this.readExpandedBlocks());
  protected readonly expandedTreeNodes = signal<Record<string, boolean>>(this.readExpandedTreeNodes());
  protected readonly projectTree = computed(() => this.buildProjectTree());

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

  protected shouldRenderProjectChildrenHorizontally(node: ProjectTreeNode): boolean {
    return node.id === 'section-05-mapa-das-areas';
  }

  protected isBlockExpanded(slug: string, blockId: string, blockTitle: string): boolean {
    const key = this.blockStateKey(slug, blockId);
    return this.expandedBlocks()[key] ?? this.shouldStartExpanded(slug, blockTitle);
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

  private isSummaryBlock(title: string): boolean {
    return this.normalizeTitle(title) === 'resumo';
  }

  private shouldStartExpanded(slug: string, blockTitle: string): boolean {
    if (slug === 'visao-geral-do-guia') {
      return false;
    }

    return this.isSummaryBlock(blockTitle);
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

      if (
        pathSegments.length === 1 &&
        this.normalizeTitle(pathSegments[0]) === this.normalizeTitle(sectionNode.label)
      ) {
        continue;
      }

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
