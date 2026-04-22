import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { MentorPointsService } from './mentor-points.service';
import {
  validateSocialHandle,
  buildSocialUrl,
  stripSocialPrefix,
  SocialLinkField,
} from './social-links.utils';

export interface SocialLinks {
  github_username: string;
  linkedin_url: string;
  instagram_url: string;
  youtube_url: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  readonly mentorPoints = inject(MentorPointsService);

  private readonly _socialLinks = signal<SocialLinks>({
    github_username: '',
    linkedin_url: '',
    instagram_url: '',
    youtube_url: '',
  });
  private readonly _saving = signal(false);
  private readonly _saveError = signal<string | null>(null);
  private readonly _saveSuccess = signal(false);

  readonly socialLinks = this._socialLinks.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly saveError = this._saveError.asReadonly();
  readonly saveSuccess = this._saveSuccess.asReadonly();

  async loadSocialLinks(): Promise<void> {
    const user = this.auth.user();
    if (!user || !this.supabase.isConfigured) return;

    const { data } = await this.supabase.client!
      .from('profiles')
      .select('github_username, linkedin_url, instagram_url, youtube_url')
      .eq('id', user.id)
      .single();

    if (data) {
      this._socialLinks.set({
        github_username: stripSocialPrefix('github', data.github_username ?? ''),
        linkedin_url: stripSocialPrefix('linkedin', data.linkedin_url ?? ''),
        instagram_url: stripSocialPrefix('instagram', data.instagram_url ?? ''),
        youtube_url: stripSocialPrefix('youtube', data.youtube_url ?? ''),
      });
    }

    await this.mentorPoints.loadPoints();
  }

  async saveSocialLinks(links: SocialLinks): Promise<void> {
    const user = this.auth.user();
    if (!user || !this.supabase.isConfigured) return;

    const fields: SocialLinkField[] = ['github', 'linkedin', 'instagram', 'youtube'];
    const handleMap: Record<SocialLinkField, string> = {
      github: links.github_username,
      linkedin: links.linkedin_url,
      instagram: links.instagram_url,
      youtube: links.youtube_url,
    };

    for (const field of fields) {
      if (!validateSocialHandle(field, handleMap[field])) {
        this._saveError.set(`Handle do ${field} inválido. Use apenas o nome de usuário, sem o link completo.`);
        return;
      }
    }

    this._saving.set(true);
    this._saveError.set(null);
    this._saveSuccess.set(false);

    try {
      const { error } = await this.supabase.client!
        .from('profiles')
        .update({
          github_username: buildSocialUrl('github', links.github_username) || null,
          linkedin_url: buildSocialUrl('linkedin', links.linkedin_url) || null,
          instagram_url: buildSocialUrl('instagram', links.instagram_url) || null,
          youtube_url: buildSocialUrl('youtube', links.youtube_url) || null,
        })
        .eq('id', user.id);

      if (error) {
        const pgError = error as { code?: string; message?: string };
        if (pgError.code === '23505') {
          this._saveError.set('Este username do GitHub já está vinculado a outra conta Fulldev.');
        } else {
          this._saveError.set('Erro ao salvar. Tente novamente.');
        }
        console.error('[ProfileService] saveSocialLinks:', pgError);
        return;
      }

      this._socialLinks.set(links);
      this._saveSuccess.set(true);
      setTimeout(() => this._saveSuccess.set(false), 3000);
    } catch (err) {
      console.error('[ProfileService] saveSocialLinks threw:', err);
      this._saveError.set('Erro ao salvar. Tente novamente.');
    } finally {
      this._saving.set(false);
    }
  }
}
