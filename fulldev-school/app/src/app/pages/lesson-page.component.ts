import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  viewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { of, from } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SchoolContentService } from '../data/school-content.service';
import { AudioNarrationService } from '../services/audio-narration.service';

@Component({
  selector: 'app-lesson-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownComponent, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    @if (lesson(); as currentLesson) {
      <section class="lesson">
        <header class="lesson__hero">
          <div>
            <span class="lesson__eyebrow">Jornada guiada</span>
            <h1>{{ currentLesson.meta.title }}</h1>
            <p>
              Experiência simples, com leitura confortável, tema ajustável e áudio guiado no rodapé.
            </p>
          </div>

          <div class="lesson__stats">
            <mat-card appearance="outlined">
              <strong>{{ currentLesson.meta.estimatedReadingMinutes || '-' }} min</strong>
              <span>leitura</span>
            </mat-card>
            <mat-card appearance="outlined">
              <strong>{{ currentLesson.meta.estimatedListeningMinutes || '-' }} min</strong>
              <span>áudio</span>
            </mat-card>
          </div>
        </header>

        <nav class="lesson__breadcrumbs">
          <a routerLink="/">Fulldev School</a>
          <span>/</span>
          <span>{{ currentLesson.meta.title }}</span>
        </nav>

        <article class="lesson__body">
          @for (block of currentLesson.blocks; track block.id) {
            <section
              #lessonBlock
              class="lesson__block"
              [attr.data-block-id]="block.id"
              [class.is-active]="audio.currentBlockId() === block.id"
            >
              <markdown [data]="block.markdown"></markdown>
            </section>
          }
        </article>

        <footer class="lesson__footer-nav">
          @if (content.previousLesson(); as previous) {
            <a mat-stroked-button [routerLink]="['/', previous.slug]">
              <mat-icon>arrow_back</mat-icon>
              {{ previous.title }}
            </a>
          }

          @if (content.nextLesson(); as next) {
            <a mat-flat-button [routerLink]="['/', next.slug]">
              {{ next.title }}
              <mat-icon>arrow_forward</mat-icon>
            </a>
          }
        </footer>
      </section>
    } @else {
      <section class="lesson lesson--empty">
        <h1>Carregando conteúdo...</h1>
      </section>
    }
  `,
  styles: [
    `
      .lesson {
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 980px;
        margin: 0 auto;
      }

      .lesson__hero {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        padding: 28px;
        border: 1px solid var(--fd-border);
        border-radius: 0;
        background: color-mix(in srgb, var(--fd-surface) 92%, transparent);
      }

      .lesson__eyebrow {
        display: inline-block;
        margin-bottom: 12px;
        color: var(--fd-muted);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .lesson__hero h1 {
        margin: 0 0 8px;
        font-size: clamp(2rem, 4vw, 3.4rem);
        line-height: 1.05;
      }

      .lesson__hero p {
        max-width: 62ch;
        margin: 0;
        color: var(--fd-muted);
      }

      .lesson__stats {
        display: flex;
        gap: 12px;
      }

      .lesson__stats mat-card {
        min-width: 120px;
        padding: 16px;
        text-align: center;
      }

      .lesson__stats strong {
        display: block;
        font-size: 1.5rem;
      }

      .lesson__stats span,
      .lesson__breadcrumbs {
        color: var(--fd-muted);
      }

      .lesson__breadcrumbs {
        display: flex;
        gap: 10px;
        font-size: 0.92rem;
      }

      .lesson__breadcrumbs a {
        color: inherit;
        text-decoration: none;
      }

      .lesson__body {
        padding: 32px;
        border: 1px solid var(--fd-border);
        border-radius: 0;
        background: var(--fd-surface);
      }

      .lesson__block {
        position: relative;
        padding: 12px 0 18px;
        border-bottom: 1px solid var(--fd-border);
        transition:
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      .lesson__block.is-active {
        background: color-mix(in srgb, var(--fd-accent-line) 8%, transparent);
        box-shadow: inset 0 -3px 0 var(--fd-accent-line);
      }

      .lesson__block:last-child {
        border-bottom: 0;
      }

      .lesson__footer-nav {
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }

      .lesson--empty {
        min-height: 50vh;
        justify-content: center;
      }

      @media (max-width: 960px) {
        .lesson__hero,
        .lesson__footer-nav {
          flex-direction: column;
        }

        .lesson__stats {
          flex-wrap: wrap;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LessonPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly content = inject(SchoolContentService);
  protected readonly audio = inject(AudioNarrationService);
  private readonly blockElements = viewChildren<ElementRef<HTMLElement>>('lessonBlock');
  private lastScrolledBlockId: string | null = null;

  private readonly lessonResult = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug');
        return slug ? from(this.content.loadLessonBySlug(slug)) : of(null);
      })
    ),
    { initialValue: null }
  );

  protected readonly lesson = computed(() => this.lessonResult());

  constructor() {
    effect(() => {
      this.lesson();
      this.lastScrolledBlockId = null;
    });

    effect(() => {
      const activeId = this.audio.currentBlockId();
      const blocks = this.blockElements();

      if (!activeId || !blocks.length) {
        return;
      }

      if (this.lastScrolledBlockId === activeId) {
        return;
      }

      const activeBlock = blocks.find((item) => item.nativeElement.dataset['blockId'] === activeId);
      if (activeBlock) {
        this.lastScrolledBlockId = activeId;
        activeBlock.nativeElement.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: 'smooth'
        });
      }
    });
  }
}
