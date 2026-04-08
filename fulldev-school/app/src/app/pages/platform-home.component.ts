import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';
import { CourseProgressService } from '../services/course-progress.service';
import { PlatformDataService } from '../services/platform-data.service';

@Component({
  selector: 'app-platform-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    <section class="platform-page">
      <header class="platform-hero">
        <div>
          <span class="platform-eyebrow">Cursos</span>
          <h1>Cursos disponiveis na Fulldev School.</h1>
          <p>
            Catalogo inicial da plataforma. O primeiro curso disponivel e
            <strong>Start: Comecando na tecnologia</strong>.
          </p>
        </div>

        <div class="platform-hero__actions">
          <a mat-flat-button class="platform-button platform-button--primary" routerLink="/courses/home">Home</a>
          @if (auth.isAuthenticated()) {
            <a mat-flat-button class="platform-button platform-button--primary" routerLink="/courses/account">Minha conta</a>
          }
        </div>
      </header>

      <section class="course-grid">
        @for (course of courses(); track course.id) {
          <article class="course-card">
            <div class="course-card__cover">{{ course.coverLabel }}</div>
            <div class="course-card__body">
              <strong>{{ course.title }}</strong>
              <p>{{ course.shortDescription }}</p>
              <span>{{ course.modules.length }} modulos</span>
            </div>
            <div class="course-card__actions">
              <a mat-flat-button class="platform-button platform-button--primary" [routerLink]="['/courses', course.slug]">Entrar no curso</a>
              @if (courseProgress.isCourseCompleted(course.slug)) {
                <span class="course-card__status">Concluido</span>
              }
            </div>
          </article>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .platform-page {
        display: grid;
        gap: 18px;
      }

      .platform-hero,
      .course-card {
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .platform-hero {
        display: grid;
        gap: 18px;
        padding: 32px;
      }

      .platform-eyebrow {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .platform-hero h1,
      .course-card__body strong {
        margin: 0;
        color: var(--fd-text);
      }

      .platform-hero p,
      .course-card__body p,
      .course-card__body span,
      .course-card__status {
        margin: 0;
        color: var(--fd-muted);
      }

      .platform-hero__actions,
      .course-card__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .course-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }

      .course-card {
        display: grid;
      }

      .course-card__cover {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 180px;
        border-bottom: 1px solid var(--fd-border);
        color: var(--fd-text);
        font-size: clamp(2rem, 5vw, 3rem);
        font-weight: 700;
        letter-spacing: -0.04em;
        background: linear-gradient(180deg, rgba(178, 45, 0, 0.18), rgba(255, 255, 255, 0.02));
      }

      .course-card__body,
      .course-card__actions {
        padding: 18px;
      }

      .course-card__body {
        display: grid;
        gap: 8px;
      }

      .course-card__actions {
        padding-top: 0;
        align-items: center;
      }

      .platform-button {
        min-height: 44px;
        padding-inline: 18px;
        border-radius: var(--fd-radius);
        font-weight: 600;
      }

      .platform-button--primary {
        border: 1px solid var(--fd-accent) !important;
        color: var(--fd-white) !important;
        background: var(--fd-accent) !important;
        box-shadow: none !important;
      }

      .platform-button--primary:hover {
        border-color: var(--fd-accent-strong) !important;
        background: var(--fd-accent-strong) !important;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformHomeComponent {
  protected readonly auth = inject(AuthService);
  protected readonly platform = inject(PlatformDataService);
  protected readonly courseProgress = inject(CourseProgressService);
  protected readonly courses = computed(() => this.platform.courses());

  constructor() {
    void this.platform.ensureReady();
  }
}
