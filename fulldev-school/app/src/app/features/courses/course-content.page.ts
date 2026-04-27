import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CoursesService } from './courses.service';
import { CourseContentProgressService } from './course-content-progress.service';
import { PageShellComponent } from '../shared/ui/page-shell/page-shell.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-course-content-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    MatExpansionModule,
    MatCheckboxModule,
    MatButtonModule,
    PageShellComponent,
    EmptyStateComponent
  ],
  template: `
    <ng-container *ngIf="course() as c; else notFound">
      <fd-page-shell [title]="c.title" subtitle="Dentro do curso — marque tópicos como concluídos e acompanhe seu progresso.">
        <div slot="actions">
          <a mat-stroked-button [routerLink]="['/app/courses', c.slug]">Resumo</a>
          <a mat-stroked-button [routerLink]="['/app/courses']">Cursos</a>
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
      </fd-page-shell>
    </ng-container>

    <ng-template #notFound>
      <fd-empty-state icon="school" title="Curso não encontrado" message="Verifique o link e tente novamente.">
        <a mat-stroked-button [routerLink]="['/app/courses']">Voltar</a>
      </fd-empty-state>
    </ng-template>
  `,
  styles: [
    `
      h1 {
        margin: 0;
        font-weight: 850;
        letter-spacing: -0.02em;
      }

      p {
        margin: 6px 0 0;
        color: var(--fd-muted);
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
        border: 1px solid var(--fd-border);
      }

      :host ::ng-deep .mat-expansion-panel-header {
        padding: 18px 16px;
      }

      .panel-title .title {
        font-weight: 800;
      }

      .panel-title .subtitle {
        margin-top: 4px;
        color: var(--fd-muted);
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
        color: var(--fd-muted);
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
        background: var(--fd-page-bg);
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 700;
      }

      @media (max-width: 720px) {
        :host ::ng-deep .mat-expansion-panel-header {
          padding: 16px 14px;
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
