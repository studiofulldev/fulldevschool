import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { CourseProgressService } from '../../services/course-progress.service';
import { PlatformDataService } from '../../services/platform-data.service';
import { ProfileService, SocialLinks } from '../../services/profile.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountPageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly platform = inject(PlatformDataService);
  private readonly progress = inject(CourseProgressService);
  protected readonly profileService = inject(ProfileService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly courses = computed(() => this.platform.courses());

  protected socialDraft: SocialLinks = {
    github_username: '',
    linkedin_url: '',
    instagram_url: '',
    youtube_url: '',
  };

  protected readonly levelLabels: Record<string, string> = {
    dev_em_formacao: 'Dev em Formação',
    code_reviewer: 'Code Reviewer',
    senior_reviewer: 'Senior Reviewer',
    tech_lead: 'Tech Lead',
    fulldev_fellow: 'Fulldev Fellow',
  };

  constructor() {
    void this.platform.ensureReady();
  }

  async ngOnInit(): Promise<void> {
    await this.profileService.loadSocialLinks();
    this.socialDraft = { ...this.profileService.socialLinks() };
    this.cdr.markForCheck();
  }

  protected async saveSocialLinks(): Promise<void> {
    await this.profileService.saveSocialLinks(this.socialDraft);
    this.socialDraft = { ...this.profileService.socialLinks() };
  }

  protected progressPercent(): number {
    const pts = this.profileService.mentorPoints.points();
    const next = this.profileService.mentorPoints.nextThreshold();
    if (next === null) return 100;
    const levels = [0, 50, 150, 350, 700];
    const prev = levels.filter(l => l <= pts).at(-1) ?? 0;
    return Math.round(((pts - prev) / (next - prev)) * 100);
  }

  protected progressLabel(courseSlug: string, totalModules: number): string {
    const course = this.platform.getCourseBySlug(courseSlug);
    if (!course) return '0% concluído';
    const completed = course.modules.filter((m) =>
      this.progress.isModuleCompleted(courseSlug, m.slug)
    ).length;
    const percent = totalModules === 0 ? 0 : Math.round((completed / totalModules) * 100);
    return `${percent}% concluído`;
  }

  protected providerLabel(provider: string): string {
    if (provider === 'google') return 'Google';
    if (provider === 'linkedin_oidc') return 'LinkedIn';
    return 'e-mail';
  }

  protected roleLabel(role: string): string {
    if (role === 'admin') return 'Administrador';
    if (role === 'instructor') return 'Instrutor';
    return 'Usuário comum';
  }

  protected technicalLevelLabel(level: string | null | undefined): string {
    const map: Record<string, string> = {
      estudante: 'Estudante',
      estagiario: 'Estagiário',
      junior: 'Júnior',
      pleno: 'Pleno',
      senior: 'Sênior',
      lead: 'Lead',
      staff: 'Staff',
      principal: 'Principal',
    };
    return map[level ?? ''] ?? 'Não informado';
  }
}
