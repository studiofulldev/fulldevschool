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

  async signInWithGoogle() {
    this.ensureConfigured();
    return this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/courses/home' : undefined
      }
    });
  }

  async signOut() {
    this.ensureConfigured();
    return this.client.auth.signOut();
  }

  async upsertProfile(profile: Record<string, unknown>) {
    this.ensureConfigured();
    return this.client.from('profiles').upsert(profile).select('id').single();
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
      age: metadata['age']
    };
  }

  private resolveConfig(): SupabaseClientConfig | null {
    const runtimeConfig = this.runtimeConfig.supabase;
    if (runtimeConfig?.url && runtimeConfig.anonKey) {
      return runtimeConfig;
    }

    const url = environment.supabase.url.trim();
    const anonKey = environment.supabase.publishableKey.trim();

    if (!url || !anonKey) {
      return null;
    }

    return { url, anonKey };
  }

  private ensureConfigured(): asserts this is this & { client: SupabaseClient } {
    if (!this.client) {
      throw new Error(this.configError ?? 'Supabase indisponivel.');
    }
  }
}
