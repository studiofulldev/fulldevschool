import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { PrSubmissionService, PrSubmission } from '../../services/pr-submission.service';

@Component({
  selector: 'app-pr-review-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './pr-review-page.component.html',
  styleUrl: './pr-review-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrReviewPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly prService = inject(PrSubmissionService);

  protected prUrl = '';
  protected readonly showForm = signal(false);
  protected readonly initializing = signal(true);
  protected readonly selectedLang = signal<string | null>(null);
  protected readonly langSearch = signal('');
  protected readonly langDropdownOpen = signal(false);

  protected readonly rankedLanguages = computed(() => {
    const freq = new Map<string, number>();
    for (const s of this.prService.submissions()) {
      if (s.repo_language) freq.set(s.repo_language, (freq.get(s.repo_language) ?? 0) + 1);
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
  });

  protected readonly topLanguages = computed(() => this.rankedLanguages().slice(0, 5));

  protected readonly searchResults = computed(() => {
    const q = this.langSearch().trim().toLowerCase();
    if (!q) return this.rankedLanguages();
    return this.rankedLanguages().filter(l => l.toLowerCase().includes(q));
  });

  protected readonly filteredSubmissions = computed(() => {
    const lang = this.selectedLang();
    if (!lang) return this.prService.submissions();
    return this.prService.submissions().filter(s => s.repo_language === lang);
  });

  async ngOnInit(): Promise<void> {
    await firstValueFrom(this.auth.sessionCheckComplete$);
    await this.prService.loadSubmissions();
    this.initializing.set(false);
  }

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

  protected selectLang(lang: string | null): void {
    this.selectedLang.set(lang);
    this.langSearch.set('');
    this.langDropdownOpen.set(false);
  }

  protected openPr(pr: PrSubmission): void {
    const url = this.safeGithubUrl(pr.github_pr_url);
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected syncedAgo(syncedAt: string | undefined): string {
    if (!syncedAt) return 'nunca sincronizado';
    const diff = Date.now() - new Date(syncedAt).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    return `há ${Math.floor(hrs / 24)}d`;
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

  protected safeGithubUrl(url: string): string {
    return url.startsWith('https://github.com/') ? url : '#';
  }

  protected trackById(_: number, item: PrSubmission): string {
    return item.id;
  }
}
