import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CoursesService } from './courses.service';

@Component({
  selector: 'app-course-detail-page',
  standalone: true,
  imports: [NgIf, RouterLink, MatCardModule, MatButtonModule],
  template: `
    <ng-container *ngIf="course() as c; else notFound">
      <div class="hero">
        <div class="thumb" [style.backgroundImage]="'url(' + c.imageUrl + ')'"></div>
        <div class="info">
          <div class="meta">
            <span class="pill">{{ c.category }}</span>
            <span class="hours">{{ c.hours }}h</span>
          </div>
          <h1>{{ c.title }}</h1>
          <p class="desc">{{ c.longDescription }}</p>

          <div class="facts">
            <div class="fact">
              <div class="label">Professor</div>
              <div class="value">{{ c.instructorName }}</div>
            </div>
            <div class="fact">
              <div class="label">Carga horária</div>
              <div class="value">{{ c.hours }} horas</div>
            </div>
          </div>

          <div class="actions">
            <a mat-raised-button color="primary" [routerLink]="['/app/courses', c.slug, 'content']">
              Acessar conteúdo
            </a>
            <a mat-stroked-button [routerLink]="['/app/courses']">Voltar</a>
          </div>
        </div>
      </div>
    </ng-container>

    <ng-template #notFound>
      <mat-card class="card">
        <mat-card-title>Curso não encontrado</mat-card-title>
        <mat-card-content>
          <p>O curso pode ter sido removido ou o link está incorreto.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-stroked-button [routerLink]="['/app/courses']">Voltar para cursos</a>
        </mat-card-actions>
      </mat-card>
    </ng-template>
  `,
  styles: [
    `
      .hero {
        display: grid;
        grid-template-columns: 420px 1fr;
        gap: 18px;
        align-items: start;
      }

      .thumb {
        height: 260px;
        border-radius: 18px;
        background-size: cover;
        background-position: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .info {
        padding-top: 6px;
      }

      .meta {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .pill {
        display: inline-flex;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(124, 58, 237, 0.14);
        border: 1px solid rgba(124, 58, 237, 0.2);
        font-weight: 650;
        font-size: 12px;
      }

      .hours {
        font-size: 12px;
        color: rgba(232, 234, 240, 0.75);
      }

      h1 {
        margin: 10px 0 0;
        font-weight: 850;
        letter-spacing: -0.02em;
      }

      .desc {
        margin: 10px 0 0;
        color: rgba(232, 234, 240, 0.85);
        max-width: 70ch;
      }

      .facts {
        margin-top: 14px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .fact {
        padding: 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .label {
        font-size: 12px;
        color: rgba(232, 234, 240, 0.7);
      }

      .value {
        margin-top: 4px;
        font-weight: 700;
      }

      .actions {
        margin-top: 16px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .card {
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      @media (max-width: 960px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .thumb {
          height: 220px;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CourseDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly courses = inject(CoursesService);

  readonly course = computed(() => {
    const slug = this.route.snapshot.paramMap.get('courseSlug') ?? '';
    return this.courses.getBySlug(slug);
  });
}

