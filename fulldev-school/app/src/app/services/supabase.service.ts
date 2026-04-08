import { Injectable, inject } from '@angular/core';
import { AuthChangeEvent, AuthSession, SupabaseClient, User, createClient } from '@supabase/supabase-js';
import { RuntimeConfigService } from './runtime-config.service';
import { environment } from '../../environments/environment';

export interface SupabaseAuthState {
  event: AuthChangeEvent;
  session: AuthSession | null;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly config = this.runtimeConfig.supabase ?? this.resolveEnvironmentConfig();

  readonly client: SupabaseClient = createClient(this.config.url, this.config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  async getSession() {
    return this.client.auth.getSession();
  }

  onAuthStateChange(callback: (state: SupabaseAuthState) => void) {
    return this.client.auth.onAuthStateChange((event, session) => callback({ event, session }));
  }

  async signInWithPassword(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async signUpWithPassword(
    email: string,
    password: string,
    metadata: Record<string, unknown>
  ) {
    return this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
  }

  async signInWithGoogle() {
    return this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/courses/home' : undefined
      }
    });
  }

  async signOut() {
    return this.client.auth.signOut();
  }

  async upsertProfile(profile: Record<string, unknown>) {
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

  private resolveEnvironmentConfig() {
    const url = environment.supabase.url.trim();
    const anonKey = environment.supabase.publishableKey.trim();

    if (!url || !anonKey) {
      throw new Error(
        'Supabase config ausente. Preencha src/environments/environment.ts ou forneca window.__FULLDEV_SCHOOL_CONFIG__.supabase.'
      );
    }

    return { url, anonKey };
  }
}
