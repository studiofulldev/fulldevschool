import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService, TechnicalLevel } from '../../services/auth.service';

@Component({
  selector: 'app-profile-completion-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './profile-completion-page.component.html',
  styleUrl: './profile-completion-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileCompletionPageComponent {
  private static readonly defaultAvatarUrl = '/user-default.jpg';
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly profileStep = signal<1 | 2 | 3>(1);
  protected readonly profileSaving = signal(false);
  protected readonly registerSteps: Array<1 | 2 | 3> = [1, 2, 3];

  protected readonly profileFirstName = signal('');
  protected readonly profileLastName = signal('');
  protected readonly profileEmail = signal('');
  protected readonly profileWhatsapp = signal('');
  protected readonly profileAge = signal<number | null>(null);
  protected readonly profileTechnicalLevel = signal<TechnicalLevel | ''>('');
  protected readonly profileEducationInstitution = signal('');
  protected readonly profileAcceptedTerms = signal(false);

  protected readonly profileAvatarPreview = computed(() => this.auth.user()?.avatarUrl || '/user-default.jpg');
  protected readonly hasProviderAvatar = computed(
    () => this.profileAvatarPreview() !== ProfileCompletionPageComponent.defaultAvatarUrl
  );
  protected readonly profileStepTitle = computed(() => {
    if (this.profileStep() === 1) {
      return 'Detalhes pessoais';
    }

    if (this.profileStep() === 2) {
      return 'Complete seu cadastro';
    }

    return 'Confirme seu acesso';
  });

  constructor() {
    effect(() => {
      const user = this.auth.user();
      const [firstName = '', ...rest] = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
      this.profileFirstName.set(firstName);
      this.profileLastName.set(rest.join(' '));
      this.profileEmail.set(user?.email ?? '');
      this.profileWhatsapp.set(user?.whatsappNumber ?? '');
      this.profileAge.set(user?.age ?? null);
      this.profileTechnicalLevel.set(user?.technicalLevel ?? '');
      this.profileEducationInstitution.set(user?.educationInstitution ?? '');
      this.profileAcceptedTerms.set(Boolean(user?.acceptedTerms));
      this.profileStep.set(1);
    });
  }

  protected goToNextProfileStep(): void {
    if (this.profileStep() === 1 && !this.profileFirstName().trim()) {
      this.showToast('warning', 'Preencha o primeiro nome para continuar.');
      return;
    }

    if (this.profileStep() === 2 && (!this.profileAge() || !this.profileTechnicalLevel())) {
      this.showToast('warning', 'Preencha idade e nivel tecnico para continuar.');
      return;
    }

    this.profileStep.update((current) => (current < 3 ? ((current + 1) as 1 | 2 | 3) : current));
  }

  protected goToPreviousProfileStep(): void {
    this.profileStep.update((current) => (current > 1 ? ((current - 1) as 1 | 2 | 3) : current));
  }

  protected onAgeChange(value: string | number | null): void {
    const next = Number(value);
    this.profileAge.set(Number.isFinite(next) && next > 0 ? next : null);
  }

  protected async submitProfileCompletion(): Promise<void> {
    if (this.profileStep() !== 3) {
      this.goToNextProfileStep();
      return;
    }

    if (!this.profileAcceptedTerms()) {
      this.showToast('warning', 'Voce precisa aceitar os termos para concluir o cadastro.');
      return;
    }

    this.profileSaving.set(true);
    const name = [this.profileFirstName().trim(), this.profileLastName().trim()].filter(Boolean).join(' ');

    const result = await this.auth.completeOAuthProfile({
      name,
      whatsappNumber: this.profileWhatsapp(),
      age: this.profileAge(),
      technicalLevel: this.profileTechnicalLevel() || null,
      educationInstitution: this.profileEducationInstitution(),
      acceptedTerms: this.profileAcceptedTerms()
    });

    this.profileSaving.set(false);

    if (!result.ok) {
      this.showToast('error', result.message ?? 'Nao foi possivel salvar seus dados.');
      return;
    }

    this.showToast('success', 'Cadastro complementar salvo com sucesso.');
    void this.router.navigateByUrl('/courses/home');
  }

  protected async cancelOAuthCompletion(): Promise<void> {
    this.profileStep.set(1);
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }

  protected handleAvatarError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.endsWith(ProfileCompletionPageComponent.defaultAvatarUrl)) {
      return;
    }

    image.src = ProfileCompletionPageComponent.defaultAvatarUrl;
  }

  private showToast(kind: 'success' | 'error' | 'warning', message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 4500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['auth-toast', `auth-toast--${kind}`]
    });
  }
}
