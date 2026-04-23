import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { MentorPointsService } from './mentor-points.service';
import {
  validateLinkedInUrl,
  validateInstagramUrl,
  validateYouTubeUrl,
} from './social-links.utils';

export interface SocialLinks {
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
    linkedin_url: '',
    instagram_url: '',
    youtube_url: '',
  });
  private readonly _githubUsername = signal<string | null>(null);
  private readonly _githubConnecting = signal(false);
  private readonly _linkedinConnected = signal(false);
  private readonly _linkedinConnecting = signal(false);
  private readonly _saving = signal(false);
  private readonly _saveError = signal<string | null>(null);
  private readonly _saveSuccess = signal(false);
  // True once data has been loaded successfully — prevents repeated fetches on navigation.
  private _loaded = false;

  readonly socialLinks = this._socialLinks.asReadonly();
  readonly githubUsername = this._githubUsername.asReadonly();
  readonly githubConnecting = this._githubConnecting.asReadonly();
  readonly linkedinConnected = this._linkedinConnected.asReadonly();
  readonly linkedinConnecting = this._linkedinConnecting.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly saveError = this._saveError.asReadonly();
  readonly saveSuccess = this._saveSuccess.asReadonly();

  constructor() {
    // Reset cached state when the user signs out so a new session starts fresh.
    effect(() => {
      if (!this.auth.user() && this.auth.sessionCheckComplete()) {
        this._loaded = false;
        this._githubUsername.set(null);
        this._linkedinConnected.set(false);
        this._socialLinks.set({ linkedin_url: '', instagram_url: '', youtube_url: '' });
      }
    });
  }

  async loadSocialLinks(): Promise<void> {
    const user = this.auth.user();
    if (!user || !this.supabase.isConfigured) return;
    if (this._loaded) return;

    const [profileResult, userResult] = await Promise.all([
      this.supabase.client!
        .from('profiles')
        .select('github_username, linkedin_url, instagram_url, youtube_url')
        .eq('id', user.id)
        .single(),
      this.supabase.getUser(),
    ]);

    const data = profileResult.data;
    const supabaseUser = userResult.data.user;
    const identities = supabaseUser?.identities ?? [];

    // If both queries failed, preserve existing state rather than resetting to null.
    if (profileResult.error && !supabaseUser) {
      console.warn('[ProfileService] loadSocialLinks: both queries failed, preserving state');
      return;
    }

    // LinkedIn connection — identity already exists if user signed in via LinkedIn
    this._linkedinConnected.set(identities.some(i => i.provider === 'linkedin_oidc'));

    // GitHub: prefer verified DB value, fallback to identity (race-condition safety)
    let githubUsername = data?.github_username
      ? this.stripGitHubPrefix(data.github_username)
      : null;

    if (!githubUsername) {
      const githubIdentity = identities.find(i => i.provider === 'github');
      const fromIdentity = String((githubIdentity?.identity_data as Record<string, unknown> | undefined)?.['user_name'] ?? '');
      if (fromIdentity) {
        githubUsername = fromIdentity;
        await this.supabase.client!.from('profiles')
          .update({ github_username: fromIdentity })
          .eq('id', user.id);
      }
    }

    this._githubUsername.set(githubUsername);

    if (data) {
      this._socialLinks.set({
        linkedin_url: data.linkedin_url ?? '',
        instagram_url: data.instagram_url ?? '',
        youtube_url: data.youtube_url ?? '',
      });
    }

    this._loaded = true;
    await this.mentorPoints.loadPoints();
  }

  async saveSocialLinks(links: SocialLinks): Promise<void> {
    const user = this.auth.user();
    if (!user || !this.supabase.isConfigured) return;

    if (!validateLinkedInUrl(links.linkedin_url)) {
      this._saveError.set('URL do LinkedIn inválida. Exemplo: https://linkedin.com/in/seu-perfil');
      return;
    }
    if (!validateInstagramUrl(links.instagram_url)) {
      this._saveError.set('URL do Instagram inválida. Exemplo: https://instagram.com/seu-usuario');
      return;
    }
    if (!validateYouTubeUrl(links.youtube_url)) {
      this._saveError.set('URL do YouTube inválida. Exemplo: https://youtube.com/@seu-canal');
      return;
    }

    this._saving.set(true);
    this._saveError.set(null);
    this._saveSuccess.set(false);

    try {
      const { error } = await this.supabase.client!
        .from('profiles')
        .update({
          linkedin_url: links.linkedin_url.trim() || null,
          instagram_url: links.instagram_url.trim() || null,
          youtube_url: links.youtube_url.trim() || null,
        })
        .eq('id', user.id);

      if (error) {
        this._saveError.set('Erro ao salvar. Tente novamente.');
        console.error('[ProfileService] saveSocialLinks:', error);
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

  async linkGitHub(): Promise<void> {
    this._githubConnecting.set(true);
    try {
      const { error } = await this.supabase.linkGitHubIdentity();
      if (error) {
        console.error('[ProfileService] linkGitHub:', error);
        this._githubConnecting.set(false);
      }
      // On success browser redirects — connecting state is irrelevant after navigation.
    } catch (err) {
      console.error('[ProfileService] linkGitHub threw:', err);
      this._githubConnecting.set(false);
    }
  }

  async unlinkGitHub(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const { data: { user: supabaseUser } } = await this.supabase.getUser();
    const identity = supabaseUser?.identities?.find(i => i.provider === 'github');

    if (identity) {
      const { error } = await this.supabase.unlinkIdentity(identity);
      if (error) { console.error('[ProfileService] unlinkGitHub:', error); return; }
    }

    // Always clear DB and signal — handles both OAuth identity and legacy manual entry.
    await this.supabase.client!.from('profiles').update({ github_username: null }).eq('id', user.id);
    this._githubUsername.set(null);
  }

  async linkLinkedIn(): Promise<void> {
    this._linkedinConnecting.set(true);
    try {
      const { error } = await this.supabase.linkLinkedInIdentity();
      if (error) {
        console.error('[ProfileService] linkLinkedIn:', error);
        this._linkedinConnecting.set(false);
      }
      // On success browser redirects.
    } catch (err) {
      console.error('[ProfileService] linkLinkedIn threw:', err);
      this._linkedinConnecting.set(false);
    }
  }

  async unlinkLinkedIn(): Promise<void> {
    const { data: { user: supabaseUser } } = await this.supabase.getUser();
    const identity = supabaseUser?.identities?.find(i => i.provider === 'linkedin_oidc');

    if (identity) {
      const { error } = await this.supabase.unlinkIdentity(identity);
      if (error) { console.error('[ProfileService] unlinkLinkedIn:', error); return; }
    }

    this._linkedinConnected.set(false);
  }

  private stripGitHubPrefix(value: string): string {
    if (!value) return '';
    return value.replace(/^https?:\/\/(www\.)?github\.com\//, '').trim();
  }
}
