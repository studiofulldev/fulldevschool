import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'fd-empty-state',
  standalone: true,
  imports: [NgIf, MatIconModule],
  template: `
    <div class="empty">
      <mat-icon *ngIf="icon" class="icon">{{ icon }}</mat-icon>
      <div class="title">{{ title }}</div>
      <div class="message" *ngIf="message">{{ message }}</div>
      <div class="actions">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon: string | null = null;
  @Input({ required: true }) title!: string;
  @Input() message: string | null = null;
}

