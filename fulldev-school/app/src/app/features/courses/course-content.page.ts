import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { CoursesService } from './courses.service';
import { CourseContentProgressService } from './course-content-progress.service';

@Component({
  selector: 'app-course-content-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    MatExpansionModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  template: `
    <ng-container *ngIf="course() as c; else notFound">
      <div class="top">
        <div>
          <h1>{{ c.title }}</h1>
          <p>Conteúdo do curso</p>
        </div>
        <a mat-stroked-button [routerLink]="['/app/courses', c.slug]">Resumo do curso</a>
      </div>

      <mat-accordion class="accordion" multi>
        <mat-expansion-panel *ngFor="let m of c.modules">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <div class="panel-title">
                <div class="title">{{ m.title }}</div>
                <div class="subtitle">{{ m.subtitle }}</div>
              </div>
            </mat-panel-title>
            <mat-panel-description>
              <div class="progress">
                <div class="ring" [style.--p]="moduleProgress(c.slug, m.topics.map((t) => t.slug)) + 'deg'">
                  <span>{{ modulePercent(c.slug, m.topics.map((t) => t.slug)) }}%</span>
                </div>
              </div>
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="topic" *ngFor="let t of m.topics">
            <mat-checkbox
              [checked]="progress.isTopicCompleted(c.slug, t.slug)"
              (change)="progress.setTopicCompleted(c.slug, t.slug, $event.checked)"
            >
              {{ t.title }}
            </mat-checkbox>
            <div class="minutes">{{ t.minutes }} min</div>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </ng-container>

    <ng-template #notFound>
      <div class="empty">
        <h2>Curso não encontrado</h2>
        <a mat-stroked-button [routerLink]="['/app/courses']">Voltar</a>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 12px;
        margin-bottom: 16px;
      }

      h1 {
        margin: 0;
        font-weight: 850;
        letter-spacing: -0.02em;
      }

      p {
        margin: 6px 0 0;
        color: rgba(232, 234, 240, 0.85);
      }

      .accordion {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      :host ::ng-deep .mat-expansion-panel {
        border-radius: 16px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      :host ::ng-deep .mat-expansion-panel-header {
        padding: 18px 16px;
      }

      .panel-title .title {
        font-weight: 800;
      }

      .panel-title .subtitle {
        margin-top: 4px;
        color: rgba(232, 234, 240, 0.7);
        font-size: 13px;
      }

      .topic {
        padding: 10px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }

      .minutes {
        font-size: 12px;
        color: rgba(232, 234, 240, 0.7);
      }

      .ring {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: conic-gradient(#22d3ee var(--p), rgba(255, 255, 255, 0.12) 0deg);
      }

      .ring span {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        background: #0b0f19;
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 700;
      }

      .empty {
        margin-top: 24px;
        padding: 22px;
        border-radius: 16px;
        border: 1px dashed rgba(255, 255, 255, 0.12);
      }

      @media (max-width: 720px) {
        .top {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseContentPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly courses = inject(CoursesService);
  readonly progress = inject(CourseContentProgressService);

  readonly course = computed(() => {
    const slug = this.route.snapshot.paramMap.get('courseSlug') ?? '';
    return this.courses.getBySlug(slug);
  });

  modulePercent(courseSlug: string, topicSlugs: string[]): number {
    return this.progress.progressPercent(courseSlug, topicSlugs);
  }

  moduleProgress(courseSlug: string, topicSlugs: string[]): number {
    const percent = this.modulePercent(courseSlug, topicSlugs);
    return Math.round((percent / 100) * 360);
  }
}
