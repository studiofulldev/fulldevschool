import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { SchoolContentService } from '../data/school-content.service';
import { PlatformDataService } from '../services/platform-data.service';
import { CourseProgressService } from '../services/course-progress.service';

@Component({
  selector: 'app-course-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    @if (course(); as currentCourse) {
      <section class="course-page">
        <header class="course-hero">
          <div class="course-hero__cover">{{ currentCourse.coverLabel }}</div>
          <div class="course-hero__copy">
            <span class="course-eyebrow">Curso</span>
            <h1>{{ currentCourse.title }}</h1>
            <p>{{ currentCourse.shortDescription }}</p>
          </div>
        </header>

        <section class="module-grid">
          @for (module of currentCourse.modules; track module.id) {
            <article class="module-card">
              <strong>{{ module.title }}</strong>
              <p>{{ module.description }}</p>
              <span>{{ module.lessons.length }} lições</span>
              <div class="module-card__actions">
                <a mat-flat-button class="course-button course-button--primary" [routerLink]="['/courses', currentCourse.slug, 'modules', module.slug]">Abrir módulo</a>
                <button mat-flat-button class="course-button course-button--primary" type="button" (click)="toggleModule(currentCourse.slug, module.slug)">
                  {{ progress.isModuleCompleted(currentCourse.slug, module.slug) ? 'Concluído' : 'Marcar como concluído' }}
                </button>
              </div>
            </article>
          }
        </section>
      </section>
    }
  `,
  styles: [
    `
      .course-page {
        display: grid;
        gap: 18px;
      }

      .course-hero,
      .module-card {
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .course-hero {
        display: grid;
        gap: 18px;
        padding: 24px;
      }

      .course-hero__cover {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 160px;
        border: 1px solid var(--fd-border);
        color: var(--fd-text);
        font-size: clamp(2rem, 6vw, 3rem);
        font-weight: 700;
      }

      .course-eyebrow {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .module-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
      }

      .module-card {
        display: grid;
        gap: 8px;
        padding: 18px;
      }

      .module-card strong,
      .course-hero__copy h1,
      .course-hero__copy p,
      .module-card p,
      .module-card span {
        margin: 0;
      }

      .module-card p,
      .module-card span,
      .course-hero__copy p {
        color: var(--fd-muted);
      }

      .module-card__actions {
        display: grid;
        gap: 10px;
        margin-top: 8px;
      }

      .course-button {
        min-height: 44px;
        padding-inline: 18px;
        border-radius: var(--fd-radius);
        font-weight: 600;
      }

      .course-button--primary {
        border: 1px solid var(--fd-accent) !important;
        color: var(--fd-white) !important;
        background: var(--fd-accent) !important;
        box-shadow: none !important;
      }

      .course-button--primary:hover {
        border-color: var(--fd-accent-strong) !important;
        background: var(--fd-accent-strong) !important;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseOverviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly platform = inject(PlatformDataService);
  private readonly content = inject(SchoolContentService);
  protected readonly progress = inject(CourseProgressService);
  private readonly courseSlug = toSignal(this.route.paramMap.pipe(map((params) => params.get('courseSlug') ?? 'start')), {
    initialValue: 'start'
  });
  protected readonly course = computed(() => this.platform.getCourseBySlug(this.courseSlug()));

  constructor() {
    void this.platform.ensureReady();
    this.content.clearCurrentLesson();
  }

  protected toggleModule(courseSlug: string, moduleSlug: string): void {
    const next = !this.progress.isModuleCompleted(courseSlug, moduleSlug);
    this.progress.setModuleCompleted(courseSlug, moduleSlug, next);
  }
}
