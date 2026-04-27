import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MentoringService } from './mentoring.service';
import { PageShellComponent } from '../shared/ui/page-shell/page-shell.component';

@Component({
  selector: 'app-mentors-list-page',
  standalone: true,
  imports: [NgFor, RouterLink, MatCardModule, MatButtonModule, PageShellComponent],
  template: `
    <fd-page-shell title="Mentoria" subtitle="Escolha um mentor e agende seu horário.">
      <div class="grid">
        <mat-card class="mentor" *ngFor="let m of mentors()">
          <div class="row">
            <img class="avatar" [src]="m.photoUrl" [alt]="m.name" />
            <div class="info">
              <h3>{{ m.name }}</h3>
              <div class="specialty">{{ m.specialty }}</div>
            </div>
          </div>

          <mat-card-content>
            <p>{{ m.bio }}</p>
            <div class="tags">
              <span class="tag" *ngFor="let s of m.stacks">{{ s }}</span>
            </div>
          </mat-card-content>

          <mat-card-actions align="end">
            <a mat-stroked-button color="primary" [routerLink]="['/app/mentoring', m.id]">Exibir dados do mentor</a>
          </mat-card-actions>
        </mat-card>
      </div>
    </fd-page-shell>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .mentor {
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--fd-border);
      }

      .row {
        display: flex;
        gap: 12px;
        padding: 16px 16px 0;
        align-items: center;
      }

      .avatar {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        object-fit: cover;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      h3 {
        margin: 0;
        font-weight: 800;
      }

      .specialty {
        margin-top: 4px;
        color: var(--fd-muted);
        font-size: 13px;
      }

      .tags {
        margin-top: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tag {
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(178, 45, 0, 0.14);
        border: 1px solid rgba(178, 45, 0, 0.22);
        font-size: 12px;
        font-weight: 650;
      }

      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentorsListPageComponent {
  private readonly mentoring = inject(MentoringService);
  readonly mentors = computed(() => this.mentoring.list());
}
