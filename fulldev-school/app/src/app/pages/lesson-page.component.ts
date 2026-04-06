import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SchoolContentService } from '../data/school-content.service';

@Component({
  selector: 'app-lesson-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    @if (lesson(); as currentLesson) {
      <section class="lesson">
        <header class="lesson__hero">
          <div>
            <span class="lesson__eyebrow">Fulldev School</span>
            <h1>{{ currentLesson.meta.title }}</h1>
          </div>
        </header>

        <nav class="lesson__breadcrumbs">
          <a routerLink="/">Fulldev School</a>
          <span>/</span>
          <span>{{ currentLesson.meta.title }}</span>
        </nav>

        <article class="lesson__body">
          @for (block of currentLesson.blocks; track block.id) {
            <section class="lesson__block">
              <div [innerHTML]="blockHtml(block.id)"></div>
            </section>
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

      .lesson__breadcrumbs a {
        color: inherit;
        text-decoration: none;
      }

      .lesson__body {
        padding: 32px;
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .lesson__block {
        position: relative;
        padding: 18px 0 24px;
        border-bottom: 1px solid var(--fd-border);
        transition:
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      .lesson__block:last-child {
        border-bottom: 0;
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

      :host ::ng-deep .lesson__block h2 {
        margin: 0 0 12px;
        font-size: var(--fd-text-lg);
        line-height: 1.15;
      }

      :host ::ng-deep .lesson__block p,
      :host ::ng-deep .lesson__block li {
        color: var(--fd-muted);
        font-size: var(--fd-text-md);
        line-height: var(--fd-leading-loose);
      }

      :host ::ng-deep .lesson__block ul,
      :host ::ng-deep .lesson__block ol {
        padding-left: 1.3rem;
      }

      :host ::ng-deep .lesson__block h3 {
        margin: 18px 0 10px;
        color: var(--fd-text);
        font-size: var(--fd-text-md);
        line-height: 1.25;
      }

      :host ::ng-deep .lesson__block strong {
        color: var(--fd-text);
      }

      :host ::ng-deep .lesson__block code {
        padding: 0.12rem 0.35rem;
        background: rgba(255, 255, 255, 0.06);
        color: var(--fd-text);
      }

      :host ::ng-deep .lesson__block a {
        color: var(--fd-text);
        text-decoration: underline;
        text-decoration-color: rgba(255, 255, 255, 0.22);
      }

      :host ::ng-deep .lesson__block table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
      }

      :host ::ng-deep .lesson__block th,
      :host ::ng-deep .lesson__block td {
        padding: 12px;
        border: 1px solid var(--fd-border);
        text-align: left;
        vertical-align: top;
        color: var(--fd-muted);
        font-size: var(--fd-text-sm);
      }

      :host ::ng-deep .lesson__block th {
        color: var(--fd-text);
        background: rgba(255, 255, 255, 0.03);
      }

      @media (max-width: 960px) {
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
  protected readonly content = inject(SchoolContentService);

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
}
