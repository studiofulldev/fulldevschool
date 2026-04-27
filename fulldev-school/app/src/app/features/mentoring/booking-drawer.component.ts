import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { BookingDrawerService } from './booking-drawer.service';

@Component({
  selector: 'app-booking-drawer',
  standalone: true,
  imports: [NgIf, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="drawer" *ngIf="selection() as s" [class.drawer--open]="open()">
      <button mat-button class="handle" type="button" (click)="toggle()">
        <mat-icon>{{ open() ? 'expand_more' : 'expand_less' }}</mat-icon>
        <span>Agendamento</span>
        <span class="spacer"></span>
        <span class="pill">{{ s.date }} • {{ s.time }}</span>
      </button>

      <div class="content" *ngIf="open()">
        <mat-card class="card">
          <mat-card-title>{{ s.mentor.name }}</mat-card-title>
          <mat-card-content>
            <div class="row">
              <div class="label">Data</div>
              <div class="value">{{ s.date }}</div>
            </div>
            <div class="row">
              <div class="label">Horário</div>
              <div class="value">{{ s.time }}</div>
            </div>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-stroked-button type="button" (click)="drawer.clear()">Remover</button>
            <button mat-raised-button color="primary" type="button" disabled>Continuar</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .drawer {
        position: fixed;
        left: 24px;
        right: 24px;
        bottom: 16px;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(11, 15, 25, 0.9);
        backdrop-filter: blur(14px);
        overflow: hidden;
        z-index: 50;
      }

      .drawer--open {
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
      }

      .handle {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        color: rgba(232, 234, 240, 0.95);
      }

      .spacer {
        flex: 1;
      }

      .pill {
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(34, 211, 238, 0.12);
        border: 1px solid rgba(34, 211, 238, 0.18);
        font-size: 12px;
        font-weight: 650;
      }

      .content {
        padding: 12px;
      }

      .card {
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      .row:last-child {
        border-bottom: none;
      }

      .label {
        color: rgba(232, 234, 240, 0.7);
        font-size: 12px;
      }

      .value {
        font-weight: 700;
      }

      @media (max-width: 720px) {
        .drawer {
          left: 12px;
          right: 12px;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingDrawerComponent {
  readonly drawer = inject(BookingDrawerService);
  readonly selection = this.drawer.selection;
  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }
}
