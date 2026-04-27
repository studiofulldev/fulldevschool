import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'fd-loading-inline',
  standalone: true,
  imports: [NgIf, MatProgressSpinnerModule],
  template: `
    <div class="loading" *ngIf="show">
      <mat-progress-spinner mode="indeterminate" [diameter]="diameter" />
      <span *ngIf="label">{{ label }}</span>
    </div>
  `,
  styleUrl: './loading-inline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingInlineComponent {
  @Input() show = false;
  @Input() label: string | null = null;
  @Input() diameter = 22;
}

