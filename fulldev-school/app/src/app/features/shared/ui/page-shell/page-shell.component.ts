import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'fd-page-shell',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="page">
      <div class="header" *ngIf="title || subtitle">
        <div class="titles">
          <h1 *ngIf="title">{{ title }}</h1>
          <p *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <div class="actions">
          <ng-content select="[slot=actions]" />
        </div>
      </div>

      <div class="content">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './page-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
}

