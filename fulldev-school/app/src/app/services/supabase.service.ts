import { Injectable, inject } from '@angular/core';
import { AuthChangeEvent, AuthSession, SupabaseClient, User, createClient } from '@supabase/supabase-js';
import { RuntimeConfigService } from './runtime-config.service';
import { environment } from '../../environments/environment';

export interface SupabaseAuthState {
  event: AuthChangeEvent;
  session: AuthSession | null;
}

interface SupabaseClientConfig {
  url: string;
  anonKey: string;
}

export type OAuthProvider = 'google' | 'linkedin_oidc';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly config = this.resolveConfig();
  readonly isConfigured = this.config !== null;
  readonly configError = this.isConfigured
    ? null
    : 'Supabase config ausente. Publique public/runtime-config.js com window.__FULLDEV_SCHOOL_CONFIG__.supabase ou preencha src/environments/environment.prod.ts.';
  readonly client: SupabaseClient | null = this.config
    ? createClient(this.config.url, this.config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

  async getSession() {
    this.ensureConfigured();
    return this.client.auth.getSession();
  }

  onAuthStateChange(callback: (state: SupabaseAuthState) => void) {
    this.ensureConfigured();
    return this.client.auth.onAuthStateChange((event, session) => callback({ event, session }));
  }

  async signInWithPassword(email: string, password: string) {
    this.ensureConfigured();
    return this.client.auth.signInWithPassword({ email, password });
  }

  async signUpWithPassword(
    email: string,
    password: string,
    metadata: Record<string, unknown>
  ) {
    this.ensureConfigured();
    return this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
  }

  async signInWithOAuth(provider: OAuthProvider) {
    this.ensureConfigured();
    return this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/courses/home' : undefined
      }
    });
  }

  async signOut() {
    this.ensureConfigured();
    return this.client.auth.signOut();
  }

  async updateUserMetadata(metadata: Record<string, unknown>) {
    this.ensureConfigured();
    return this.client.auth.updateUser({
      data: metadata
    });
  }

  async upsertProfile(profile: Record<string, unknown>) {
    this.ensureConfigured();
    return this.client.from('profiles').upsert(profile).select('id').single();
  }

  async upsertLead(lead: Record<string, unknown>) {
    this.ensureConfigured();
    return this.client
      .from('leads')
      .upsert(lead, { onConflict: 'email' })
      .select('email')
      .single();
  }

  async upsertProgress(row: Record<string, unknown>) {
    this.ensureConfigured();
    return this.client
      .from('user_progress')
      .upsert(row, { onConflict: 'user_id,course_slug,lesson_slug,module_slug,type' });
  }

  async fetchUserProgress(userId: string) {
    this.ensureConfigured();
    return this.client
      .from('user_progress')
      .select('course_slug, lesson_slug, module_slug, type, completed')
      .eq('user_id', userId);
  }

  async invokeFn(name: string, options?: { body?: Record<string, unknown> }) {
    this.ensureConfigured();
    return this.client.functions.invoke(name, options);
  }

  toUserMetadata(user: User) {
    const metadata = user.user_metadata ?? {};
    return {
      fullName: String(metadata['full_name'] ?? metadata['name'] ?? ''),
      whatsappNumber: String(metadata['whatsapp_number'] ?? ''),
      technicalLevel: metadata['technical_level'],
      educationInstitution: String(metadata['education_institution'] ?? ''),
      acceptedTerms: Boolean(metadata['accepted_terms'] ?? false),
      acceptedTermsAt: String(metadata['accepted_terms_at'] ?? ''),
      age: metadata['age'],
      role: String(metadata['app_role'] ?? metadata['role'] ?? 'user')
    };
  }

  private resolveConfig(): SupabaseClientConfig | null {
    const runtimeConfig = this.runtimeConfig.supabase;
    if (runtimeConfig?.url && runtimeConfig.anonKey) {
      return {
        url: this.normalizeUrl(runtimeConfig.url),
        anonKey: runtimeConfig.anonKey.trim()
      };
    }

    const url = this.normalizeUrl(environment.supabase.url);
    const anonKey = environment.supabase.publishableKey.trim();

    if (!url || !anonKey) {
      return null;
    }

    return { url, anonKey };
  }

  private normalizeUrl(url: string): string {
    return url.trim().replace(/\/+$/, '');
  }

  private ensureConfigured(): asserts this is this & { client: SupabaseClient } {
    if (!this.client) {
      throw new Error(this.configError ?? 'Supabase indisponivel.');
    }
  }
}
