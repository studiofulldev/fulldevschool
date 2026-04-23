import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MentorPointsService } from '../../services/mentor-points.service';

export interface MpAction {
  icon: string;
  label: string;
  points: number;
  soon?: boolean;
}

export interface MpLevel {
  key: string;
  label: string;
  threshold: number;
}

@Component({
  selector: 'app-mp-info-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mp-dialog">
      <div class="mp-dialog__header">
        <div class="mp-dialog__title-wrap">
          <mat-icon class="mp-dialog__icon">military_tech</mat-icon>
          <div>
            <h2 class="mp-dialog__title">Mentor Points</h2>
            <p class="mp-dialog__subtitle">Ganhe MP participando da comunidade</p>
          </div>
        </div>
        <button mat-icon-button class="mp-dialog__close" (click)="close()" aria-label="Fechar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="mp-dialog__body">
        <!-- Como ganhar -->
        <section class="mp-dialog__section">
          <span class="mp-dialog__section-label">Como ganhar</span>
          <ul class="mp-action-list">
            @for (action of actions; track action.label) {
              <li class="mp-action" [class.mp-action--soon]="action.soon">
                <div class="mp-action__left">
                  <span class="mp-action__icon-wrap">
                    <mat-icon>{{ action.icon }}</mat-icon>
                  </span>
                  <span class="mp-action__label">{{ action.label }}</span>
                </div>
                <span class="mp-action__badge">
                  @if (action.soon) {
                    <span class="mp-action__soon">em breve</span>
                  } @else {
                    +{{ action.points }} MP
                  }
                </span>
              </li>
            }
          </ul>
        </section>

        <!-- Níveis -->
        <section class="mp-dialog__section">
          <span class="mp-dialog__section-label">Níveis</span>
          <ol class="mp-level-list">
            @for (level of levels; track level.key; let last = $last) {
              <li class="mp-level-item" [class.mp-level-item--current]="currentLevel === level.key">
                <div class="mp-level-item__track">
                  <div class="mp-level-item__dot" [class.mp-level-item__dot--active]="isUnlocked(level.threshold)"></div>
                  @if (!last) {
                    <div class="mp-level-item__line" [class.mp-level-item__line--active]="isUnlocked(levels[$index + 1]?.threshold ?? 9999)"></div>
                  }
                </div>
                <div class="mp-level-item__info">
                  <span class="mp-level-item__name" [class.mp-level-item__name--current]="currentLevel === level.key">
                    {{ level.label }}
                    @if (currentLevel === level.key) { <span class="mp-level-item__you">você</span> }
                  </span>
                  <span class="mp-level-item__threshold">{{ level.threshold === 0 ? 'início' : level.threshold + ' MP' }}</span>
                </div>
              </li>
            }
          </ol>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .mp-dialog {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .mp-dialog__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 24px 24px 0;
    }

    .mp-dialog__title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .mp-dialog__icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--fd-accent);
    }

    .mp-dialog__title {
      margin: 0;
      font-size: var(--fd-text-lg);
      font-weight: 700;
      color: var(--fd-foreground);
    }

    .mp-dialog__subtitle {
      margin: 2px 0 0;
      font-size: var(--fd-text-xs);
      color: var(--fd-muted);
    }

    .mp-dialog__close {
      flex-shrink: 0;
      color: var(--fd-muted) !important;
    }

    .mp-dialog__body {
      overflow-y: auto;
      padding: 16px 24px 28px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .mp-dialog__section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .mp-dialog__section-label {
      font-size: var(--fd-text-xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--fd-soft);
    }

    /* Actions list */
    .mp-action-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .mp-action {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--fd-radius);
      background: rgba(255,255,255,0.03);
      border: 1px solid transparent;
      transition: border-color 0.15s;

      &:hover {
        border-color: var(--fd-border);
      }

      &--soon {
        opacity: 0.5;
      }
    }

    .mp-action__left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .mp-action__icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(var(--fd-accent-rgb, 99 102 241), 0.12);
      flex-shrink: 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--fd-accent);
      }
    }

    .mp-action__label {
      font-size: var(--fd-text-sm);
      color: var(--fd-foreground);
      flex: 1;
    }

    .mp-action__badge {
      font-size: var(--fd-text-sm);
      font-weight: 700;
      color: var(--fd-accent);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .mp-action__soon {
      font-size: var(--fd-text-xs);
      font-weight: 600;
      color: var(--fd-soft);
      background: rgba(255,255,255,0.06);
      padding: 2px 8px;
      border-radius: 99px;
    }

    /* Levels */
    .mp-level-list {
      list-style: none;
      margin: 0;
      padding: 0 0 0 8px;
      display: flex;
      flex-direction: column;
    }

    .mp-level-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .mp-level-item__track {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 16px;
      flex-shrink: 0;
    }

    .mp-level-item__dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--fd-border);
      border: 2px solid var(--fd-border);
      margin-top: 4px;
      flex-shrink: 0;
      transition: background 0.2s;

      &--active {
        background: var(--fd-accent);
        border-color: var(--fd-accent);
        box-shadow: 0 0 6px rgba(var(--fd-accent-rgb, 99 102 241), 0.5);
      }
    }

    .mp-level-item__line {
      width: 2px;
      flex: 1;
      min-height: 24px;
      background: var(--fd-border);

      &--active {
        background: var(--fd-accent);
        opacity: 0.4;
      }
    }

    .mp-level-item__info {
      flex: 1;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      padding-bottom: 16px;
    }

    .mp-level-item__name {
      font-size: var(--fd-text-sm);
      color: var(--fd-muted);
      display: flex;
      align-items: center;
      gap: 6px;

      &--current {
        color: var(--fd-foreground);
        font-weight: 600;
      }
    }

    .mp-level-item__you {
      font-size: var(--fd-text-xs);
      font-weight: 700;
      color: var(--fd-accent);
      background: rgba(var(--fd-accent-rgb, 99 102 241), 0.12);
      padding: 1px 7px;
      border-radius: 99px;
    }

    .mp-level-item__threshold {
      font-size: var(--fd-text-xs);
      color: var(--fd-soft);
      white-space: nowrap;
    }
  `]
})
export class MpInfoDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<MpInfoDialogComponent>);
  readonly mentorPoints = inject(MentorPointsService);

  readonly currentLevel = this.mentorPoints.level();

  readonly actions: MpAction[] = [
    { icon: 'code',        label: 'Enviar um PR para review',                       points: 5  },
    { icon: 'rate_review', label: 'Fazer review de um PR da comunidade',             points: 10, soon: true },
    { icon: 'thumb_up',    label: 'Review aprovada pelo autor',                      points: 5,  soon: true },
    { icon: 'school',      label: 'Completar um módulo',                             points: 2,  soon: true },
    { icon: 'emoji_events',label: 'Completar um curso',                              points: 20, soon: true },
  ];

  readonly levels: MpLevel[] = [
    { key: 'dev_em_formacao', label: 'Dev em Formação', threshold: 0   },
    { key: 'code_reviewer',   label: 'Code Reviewer',   threshold: 50  },
    { key: 'senior_reviewer', label: 'Senior Reviewer', threshold: 150 },
    { key: 'tech_lead',       label: 'Tech Lead',        threshold: 350 },
    { key: 'fulldev_fellow',  label: 'Fulldev Fellow',   threshold: 700 },
  ];

  isUnlocked(threshold: number): boolean {
    return this.mentorPoints.points() >= threshold;
  }

  close(): void {
    this.dialogRef.close();
  }
}
