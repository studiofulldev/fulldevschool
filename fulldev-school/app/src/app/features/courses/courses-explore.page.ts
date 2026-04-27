import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CoursesService } from './courses.service';

@Component({
  selector: 'app-courses-explore-page',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="header">
      <div>
        <h1>Cursos</h1>
        <p>Explore os cursos disponíveis.</p>
      </div>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Buscar</mat-label>
        <input matInput [value]="query()" (input)="query.set($any($event.target).value)" placeholder="Digite um termo" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Categoria</mat-label>
        <mat-select [value]="category()" (selectionChange)="category.set($event.value)">
          <mat-option value="">Todas</mat-option>
          <mat-option *ngFor="let c of categories()" [value]="c">{{ c }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div *ngIf="loading()" class="loading">
      <mat-progress-spinner mode="indeterminate" diameter="28" />
      <span>Carregando cursos…</span>
    </div>

    <div *ngIf="!loading() && courses().length === 0" class="empty">
      <h2>Nenhum curso encontrado</h2>
      <p>Tente ajustar a busca ou filtros.</p>
    </div>

    <div class="grid" *ngIf="!loading() && courses().length > 0">
      <mat-card class="course" *ngFor="let course of courses()">
        <div class="thumb" [style.backgroundImage]="'url(' + course.imageUrl + ')'"></div>
        <mat-card-content>
          <div class="meta">
            <span class="pill">{{ course.category }}</span>
            <span class="hours">{{ course.hours }}h</span>
          </div>
          <h3>{{ course.title }}</h3>
          <p>{{ course.description }}</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-stroked-button color="primary" [routerLink]="['/app/courses', course.slug]">Ver curso</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      h1 {
        margin: 0;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      p {
        margin: 6px 0 0;
        color: rgba(232, 234, 240, 0.85);
      }

      .filters {
        margin-top: 18px;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 12px;
      }

      .grid {
        margin-top: 18px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .course {
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .thumb {
        height: 140px;
        background-size: cover;
        background-position: center;
      }

      .meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }

      .pill {
        display: inline-flex;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(34, 211, 238, 0.12);
        border: 1px solid rgba(34, 211, 238, 0.18);
        color: rgba(232, 234, 240, 0.9);
        font-weight: 600;
        font-size: 12px;
      }

      .hours {
        font-size: 12px;
        color: rgba(232, 234, 240, 0.7);
      }

      h3 {
        margin: 0;
        font-weight: 750;
      }

      .loading {
        margin-top: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        color: rgba(232, 234, 240, 0.85);
      }

      .empty {
        margin-top: 24px;
        padding: 22px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px dashed rgba(255, 255, 255, 0.12);
      }

      @media (max-width: 1100px) {
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 720px) {
        .filters {
          grid-template-columns: 1fr;
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursesExplorePageComponent {
  private readonly coursesService = inject(CoursesService);

  readonly loading = signal(false);
  readonly query = signal('');
  readonly category = signal('');
  readonly categories = computed(() => this.coursesService.categories());

  readonly courses = computed(() => this.coursesService.list({ query: this.query(), category: this.category() }));
}

