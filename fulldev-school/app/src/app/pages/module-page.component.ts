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
  selector: 'app-module-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    @if (module(); as currentModule) {
      <section class="module-page">
        <header class="module-page__header">
          <span class="module-page__eyebrow">Módulo</span>
          <h1>{{ currentModule.title }}</h1>
          <p>{{ currentModule.description }}</p>
          <button mat-flat-button class="module-button module-button--primary" type="button" (click)="toggleModule()">
            {{ progress.isModuleCompleted(courseSlug(), currentModule.slug) ? 'Concluído' : 'Marcar módulo como concluído' }}
          </button>
        </header>

        <section class="lesson-list">
          @for (lesson of currentModule.lessons; track lesson.id) {
            <article class="lesson-row">
              <div>
                <strong>{{ lesson.title }}</strong>
                <span>{{ lesson.sectionTitle }}</span>
              </div>
              <div class="lesson-row__actions">
                <button mat-flat-button class="module-button module-button--primary" type="button" (click)="toggleLesson(lesson.slug)">
                  {{ progress.isLessonCompleted(courseSlug(), lesson.slug) ? 'Concluída' : 'Concluir' }}
                </button>
                <a mat-flat-button class="module-button module-button--primary" [routerLink]="['/courses', courseSlug(), 'lessons', lesson.slug]">Abrir</a>
              </div>
            </article>
          }
        </section>
      </section>
    }
  `,
  styles: [
    `
      .module-page,
      .lesson-list {
        display: grid;
        gap: 16px;
      }

      .module-page__header,
      .lesson-row {
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .module-page__header {
        display: grid;
        gap: 12px;
        padding: 24px;
      }

      .module-page__eyebrow {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .module-page__header h1,
      .module-page__header p,
      .lesson-row strong,
      .lesson-row span {
        margin: 0;
      }

      .module-page__header p,
      .lesson-row span {
        color: var(--fd-muted);
      }

      .lesson-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px;
      }

      .lesson-row__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .module-button {
        min-height: 44px;
        padding-inline: 18px;
        border-radius: var(--fd-radius);
        font-weight: 600;
      }

      .module-button--primary {
        border: 1px solid var(--fd-accent) !important;
        color: var(--fd-white) !important;
        background: var(--fd-accent) !important;
        box-shadow: none !important;
      }

      .module-button--primary:hover {
        border-color: var(--fd-accent-strong) !important;
        background: var(--fd-accent-strong) !important;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModulePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly platform = inject(PlatformDataService);
  private readonly content = inject(SchoolContentService);
  protected readonly progress = inject(CourseProgressService);
  protected readonly courseSlug = toSignal(this.route.paramMap.pipe(map((params) => params.get('courseSlug') ?? 'start')), {
    initialValue: 'start'
  });
  private readonly moduleSlug = toSignal(this.route.paramMap.pipe(map((params) => params.get('moduleSlug') ?? '')), {
    initialValue: ''
  });
  protected readonly module = computed(() => this.platform.getModuleBySlug(this.courseSlug(), this.moduleSlug()));

  constructor() {
    void this.platform.ensureReady();
    this.content.clearCurrentLesson();
  }

  protected toggleLesson(lessonSlug: string): void {
    const next = !this.progress.isLessonCompleted(this.courseSlug(), lessonSlug);
    this.progress.setLessonCompleted(this.courseSlug(), lessonSlug, next);
  }

  protected toggleModule(): void {
    const currentModule = this.module();
    if (!currentModule) {
      return;
    }

    const next = !this.progress.isModuleCompleted(this.courseSlug(), currentModule.slug);
    this.progress.setModuleCompleted(this.courseSlug(), currentModule.slug, next);
  }
}
