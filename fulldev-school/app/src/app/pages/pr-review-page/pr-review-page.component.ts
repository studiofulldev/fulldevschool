import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PrSubmissionService, PrSubmission } from '../../services/pr-submission.service';

@Component({
  selector: 'app-pr-review-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './pr-review-page.component.html',
  styleUrl: './pr-review-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrReviewPageComponent {
  protected readonly prService = inject(PrSubmissionService);

  protected prUrl = '';
  protected readonly showForm = signal(false);

  protected toggleForm(): void {
    this.showForm.update(v => !v);
    if (!this.showForm()) this.prUrl = '';
  }

  protected async submit(): Promise<void> {
    await this.prService.submitPr(this.prUrl);
    if (!this.prService.errorMessage()) {
      this.prUrl = '';
      this.showForm.set(false);
    }
  }

  protected stateLabel(state: string): string {
    if (state === 'merged') return 'Mergeado';
    if (state === 'closed') return 'Fechado';
    return 'Aberto';
  }

  protected stateClass(state: string): string {
    if (state === 'merged') return 'pr-state--merged';
    if (state === 'closed') return 'pr-state--closed';
    return 'pr-state--open';
  }

  protected trackById(_: number, item: PrSubmission): string {
    return item.id;
  }
}
