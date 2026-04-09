import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';
import { CourseProgressService } from '../services/course-progress.service';
import { PlatformDataService } from '../services/platform-data.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    <section class="account-page">
      <article class="account-card">
        <span class="account-eyebrow">Conta</span>
        @if (auth.user(); as user) {
          <h1>{{ user.name }}</h1>
          <p>{{ user.email }}</p>
          <span>Login via {{ providerLabel(user.provider) }}</span>
          <span>Acesso: {{ roleLabel(user.role) }}</span>

          <div class="account-details">
            <div class="account-detail">
              <strong>WhatsApp</strong>
              <span>{{ user.whatsappNumber || 'Nao informado' }}</span>
            </div>
            <div class="account-detail">
              <strong>Idade</strong>
              <span>{{ user.age ?? 'Nao informada' }}</span>
            </div>
            <div class="account-detail">
              <strong>Nivel tecnico</strong>
              <span>{{ user.technicalLevel || 'Nao informado' }}</span>
            </div>
            <div class="account-detail">
              <strong>Instituicao</strong>
              <span>{{ user.educationInstitution || 'Nao informada' }}</span>
            </div>
          </div>
        } @else {
          <h1>Sua conta</h1>
          <p>Voce ainda nao esta autenticado.</p>
        }
      </article>

      <article class="account-card">
        <span class="account-eyebrow">Cursos</span>
        <div class="account-courses">
          @for (course of courses(); track course.id) {
            <div class="account-course">
              <strong>{{ course.title }}</strong>
              <span>{{ course.modules.length }} modulos</span>
              <span>{{ progressLabel(course.slug, course.modules.length) }}</span>
              <a mat-flat-button class="account-button account-button--primary" [routerLink]="['/courses', course.slug]">Abrir</a>
            </div>
          }
        </div>
      </article>
    </section>
  `,
  styles: [
    `
      .account-page {
        display: grid;
        gap: 18px;
      }

      .account-card,
      .account-course {
        border: 1px solid var(--fd-border);
        background: var(--fd-surface-overlay);
      }

      .account-card {
        display: grid;
        gap: 14px;
        padding: 24px;
      }

      .account-eyebrow {
        color: var(--fd-soft);
        font-size: var(--fd-text-xs);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .account-card h1,
      .account-card p,
      .account-course strong,
      .account-course span,
      .account-detail strong,
      .account-detail span {
        margin: 0;
      }

      .account-card p,
      .account-card span,
      .account-course span,
      .account-detail span {
        color: var(--fd-muted);
      }

      .account-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }

      .account-detail {
        display: grid;
        gap: 4px;
        padding: 14px;
        border: 1px solid var(--fd-border);
        background: rgba(255, 255, 255, 0.02);
      }

      .account-courses {
        display: grid;
        gap: 12px;
      }

      .account-course {
        display: grid;
        gap: 6px;
        padding: 16px;
      }

      .account-button {
        min-height: 44px;
        padding-inline: 18px;
        border-radius: var(--fd-radius);
        font-weight: 600;
        width: fit-content;
      }

      .account-button--primary {
        border: 1px solid var(--fd-accent) !important;
        color: var(--fd-white) !important;
        background: var(--fd-accent) !important;
        box-shadow: none !important;
      }

      .account-button--primary:hover {
        border-color: var(--fd-accent-strong) !important;
        background: var(--fd-accent-strong) !important;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly platform = inject(PlatformDataService);
  private readonly progress = inject(CourseProgressService);
  protected readonly courses = computed(() => this.platform.courses());

  constructor() {
    void this.platform.ensureReady();
  }

  protected progressLabel(courseSlug: string, totalModules: number): string {
    const course = this.platform.getCourseBySlug(courseSlug);
    if (!course) {
      return '0% concluido';
    }

    const completed = course.modules.filter((module) => this.progress.isModuleCompleted(courseSlug, module.slug)).length;
    const percent = totalModules === 0 ? 0 : Math.round((completed / totalModules) * 100);
    return `${percent}% concluido`;
  }

  protected providerLabel(provider: string): string {
    if (provider === 'google') {
      return 'Google';
    }

    if (provider === 'linkedin_oidc') {
      return 'LinkedIn';
    }

    return 'e-mail';
  }

  protected roleLabel(role: string): string {
    if (role === 'admin') {
      return 'Administrador';
    }

    if (role === 'instructor') {
      return 'Instrutor';
    }

    return 'Usuario comum';
  }
}
