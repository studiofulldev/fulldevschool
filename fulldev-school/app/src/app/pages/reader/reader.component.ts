import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReadingSessionService } from '../../services/reading-session.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="reader">
      <div class="reader__controls">
        <button mat-flat-button color="primary" (click)="onPlay()">
          {{ session.state() === 'playing' ? 'Pausar' : 'Play' }}
        </button>
        <button mat-stroked-button type="button" (click)="session.stop()">Parar</button>
        <mat-form-field appearance="outline">
          <mat-label>Velocidade</mat-label>
          <input matInput type="number" [value]="session.playbackRate()" step="0.1" min="0.5" max="2" (change)="onSpeed($any($event.target).value)">
        </mat-form-field>
      </div>
      <div class="reader__text">
        <span
          *ngFor="let word of session.words(); let i = index"
          [class.active]="i === session.currentWordIndex()"
        >
          {{ word.text }}
        </span>
      </div>
    </section>
  `,
  styles: [
    `
      .reader {
        max-width: 900px;
        margin: 32px auto;
        padding: 24px;
        border: 1px solid rgba(15, 23, 42, 0.12);
        border-radius: 12px;
        background: var(--fd-surface);
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      }

      .reader__controls {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }

      .reader__text {
        margin-top: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 1.25rem;
        line-height: 1.85;
      }

      .reader__text span {
        padding: 2px 6px;
        border-radius: 4px;
        transition: background 150ms ease;
      }

      .reader__text span.active {
        background: rgba(10, 132, 255, 0.18);
        color: #0a84ff;
        font-weight: 600;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReaderComponent {
  private readonly sampleText =
    'This is a reader sample text to demonstrate synchronized highlighting.';

  constructor(public session: ReadingSessionService) {
    this.session.start(this.sampleText);
  }

  onPlay(): void {
    if (this.session.state() === 'playing') {
      this.session.pause();
    } else if (this.session.state() === 'paused') {
      this.session.resume();
    } else {
      this.session.start(this.sampleText);
    }
  }

  onSpeed(value: number): void {
    this.session.setSpeed(Number(value) || 1);
  }
}
