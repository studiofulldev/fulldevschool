import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MentoringService } from './mentoring.service';
import { BookingDrawerService } from './booking-drawer.service';
import { BookingDrawerComponent } from './booking-drawer.component';

@Component({
  selector: 'app-mentor-profile-page',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, MatButtonModule, MatCardModule, MatIconModule, BookingDrawerComponent],
  template: `
    <ng-container *ngIf="mentor() as m; else notFound">
      <div class="top">
        <a mat-stroked-button [routerLink]="['/app/mentoring']">Voltar</a>
      </div>

      <div class="layout">
        <mat-card class="card left">
          <div class="mentor">
            <img class="photo" [src]="m.photoUrl" [alt]="m.name" />
            <div>
              <h1>{{ m.name }}</h1>
              <div class="specialty">{{ m.specialty }}</div>
              <div class="tags">
                <span class="tag" *ngFor="let s of m.stacks">{{ s }}</span>
              </div>
            </div>
          </div>

          <mat-card-content>
            <h2>Bio</h2>
            <p>{{ m.bio }}</p>
            <h2>Experiência</h2>
            <p>{{ m.experience }}</p>

            <h2>Redes</h2>
            <div class="socials">
              <a class="social" *ngFor="let s of m.socials" [href]="s.url" target="_blank" rel="noreferrer">
                <mat-icon>link</mat-icon>
                <span>{{ s.label }}</span>
              </a>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="card right">
          <mat-card-title>Agenda</mat-card-title>
          <mat-card-content>
            <div class="days">
              <button
                type="button"
                class="day"
                *ngFor="let d of m.availability"
                [class.day--active]="selectedDay() === d.date"
                (click)="selectedDay.set(d.date)"
              >
                {{ d.date }}
              </button>
            </div>

            <div class="slots" *ngIf="selectedAvailability() as day">
              <button
                type="button"
                class="slot"
                *ngFor="let t of day.slots"
                (click)="selectSlot(m.id, m.name, m.photoUrl, m.specialty, m.bio, m.stacks, day.date, t)"
              >
                {{ t }}
              </button>
            </div>

            <div class="empty" *ngIf="!selectedAvailability()">
              Selecione uma data para ver horários disponíveis.
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <app-booking-drawer />
    </ng-container>

    <ng-template #notFound>
      <mat-card class="card">
        <mat-card-title>Mentor não encontrado</mat-card-title>
        <mat-card-actions align="end">
          <a mat-stroked-button [routerLink]="['/app/mentoring']">Voltar</a>
        </mat-card-actions>
      </mat-card>
    </ng-template>
  `,
  styles: [
    `
      .top {
        margin-bottom: 12px;
      }

      .layout {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 16px;
        align-items: start;
      }

      .card {
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .mentor {
        padding: 16px;
        display: grid;
        grid-template-columns: 84px 1fr;
        gap: 14px;
        align-items: center;
      }

      .photo {
        width: 84px;
        height: 84px;
        border-radius: 18px;
        object-fit: cover;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }

      h1 {
        margin: 0;
        font-weight: 900;
        letter-spacing: -0.02em;
      }

      .specialty {
        margin-top: 6px;
        color: rgba(232, 234, 240, 0.75);
      }

      h2 {
        margin: 16px 0 6px;
        font-size: 14px;
        font-weight: 850;
      }

      p {
        margin: 0;
        color: rgba(232, 234, 240, 0.85);
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
        background: rgba(34, 211, 238, 0.12);
        border: 1px solid rgba(34, 211, 238, 0.18);
        font-size: 12px;
        font-weight: 650;
      }

      .socials {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .social {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: rgba(232, 234, 240, 0.9);
        padding: 8px 10px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .days {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      }

      .day {
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.03);
        color: rgba(232, 234, 240, 0.9);
        cursor: pointer;
      }

      .day--active {
        border-color: rgba(124, 58, 237, 0.45);
        background: rgba(124, 58, 237, 0.16);
      }

      .slots {
        margin-top: 14px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .slot {
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.03);
        color: rgba(232, 234, 240, 0.9);
        cursor: pointer;
      }

      .slot:hover {
        border-color: rgba(34, 211, 238, 0.4);
      }

      .empty {
        margin-top: 14px;
        color: rgba(232, 234, 240, 0.7);
      }

      @media (max-width: 1020px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentorProfilePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly mentoring = inject(MentoringService);
  private readonly booking = inject(BookingDrawerService);

  readonly mentor = computed(() => {
    const id = this.route.snapshot.paramMap.get('mentorId') ?? '';
    return this.mentoring.getById(id);
  });

  readonly selectedDay = signal<string | null>(null);

  readonly selectedAvailability = computed(() => {
    const m = this.mentor();
    const day = this.selectedDay();
    if (!m || !day) {
      return null;
    }
    return m.availability.find((d) => d.date === day) ?? null;
  });

  selectSlot(
    mentorId: string,
    mentorName: string,
    photoUrl: string,
    specialty: string,
    bio: string,
    stacks: string[],
    date: string,
    time: string
  ): void {
    this.booking.select({
      mentor: { id: mentorId, name: mentorName, photoUrl, specialty, bio, stacks },
      date,
      time
    });
  }
}

