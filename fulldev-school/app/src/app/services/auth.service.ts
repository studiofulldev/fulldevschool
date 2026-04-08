import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type AuthProvider = 'google' | 'email';
export type TechnicalLevel = 'iniciante' | 'intermediario' | 'avancado';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  provider: AuthProvider;
  whatsappNumber?: string;
  age?: number | null;
  technicalLevel?: TechnicalLevel | null;
  educationInstitution?: string;
  acceptedTerms?: boolean;
  acceptedTermsAt?: string | null;
}

export interface EmailRegistrationPayload {
  name: string;
  email: string;
  password: string;
  whatsappNumber?: string;
  age?: number | null;
  technicalLevel: TechnicalLevel;
  educationInstitution?: string;
  acceptedTerms: boolean;
}

export interface AuthActionResult {
  ok: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly storageKey = 'fulldev-school.auth.user';
  private readonly userState = signal<AuthUser | null>(this.readUser());

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  constructor() {
    void this.restoreSupabaseSession();

    this.supabase.onAuthStateChange(({ session }) => {
      const supabaseUser = session?.user;
      if (!supabaseUser) {
        this.clearUser();
        return;
      }

      this.setUser(this.mapSupabaseUser(supabaseUser));
    });
  }

  async signInWithGoogle(): Promise<AuthActionResult> {
    try {
      const { data, error } = await this.supabase.signInWithGoogle();
      if (error) {
        return { ok: false, message: error.message };
      }

      if (!data.url) {
        return { ok: false, message: 'Nao foi possivel iniciar o login com Google.' };
      }

      return { ok: true };
    } catch {
      return { ok: false, message: 'Nao foi possivel conectar ao provedor de autenticacao.' };
    }
  }

  async signInWithEmail(email: string, password: string): Promise<AuthActionResult> {
    try {
      const { data, error } = await this.supabase.signInWithPassword(email.trim().toLowerCase(), password.trim());
      if (error) {
        return { ok: false, message: this.normalizeSupabaseAuthError(error.message) };
      }

      if (!data.user) {
        return { ok: false, message: 'Nao foi possivel iniciar a sessao.' };
      }

      this.setUser(this.mapSupabaseUser(data.user));
      return { ok: true };
    } catch {
      return { ok: false, message: 'Nao foi possivel validar sua conta no momento.' };
    }
  }

  async registerWithEmail(payload: EmailRegistrationPayload): Promise<AuthActionResult> {
    const email = payload.email.trim().toLowerCase();
    const name = payload.name.trim();
    const password = payload.password.trim();

    if (!payload.acceptedTerms) {
      return { ok: false, message: 'Voce precisa aceitar os termos para continuar.' };
    }

    if (!name || !email || !password || !payload.technicalLevel || !payload.age) {
      return { ok: false, message: 'Preencha todos os campos obrigatorios.' };
    }

    const acceptedAt = new Date().toISOString();
    const metadata = {
      full_name: name,
      whatsapp_number: payload.whatsappNumber?.trim() || '',
      age: payload.age,
      technical_level: payload.technicalLevel,
      education_institution: payload.educationInstitution?.trim() || '',
      accepted_terms: true,
      accepted_terms_at: acceptedAt
    };

    try {
      const { data, error } = await this.supabase.signUpWithPassword(email, password, metadata);
      if (error) {
        return { ok: false, message: this.normalizeSupabaseAuthError(error.message) };
      }

      if (data.user) {
        await this.tryUpsertProfile({
          id: data.user.id,
          email,
          full_name: name,
          whatsapp_number: metadata.whatsapp_number,
          age: metadata.age,
          technical_level: metadata.technical_level,
          education_institution: metadata.education_institution,
          avatar_url: data.user.user_metadata['avatar_url'] ?? null,
          provider: 'email',
          accepted_terms: true,
          accepted_terms_at: acceptedAt,
          updated_at: acceptedAt
        });

        this.setUser(this.mapSupabaseUser(data.user));
      }

      return {
        ok: true,
        message: data.session ? undefined : 'Conta criada. Verifique seu e-mail para confirmar o cadastro.'
      };
    } catch {
      return { ok: false, message: 'Nao foi possivel concluir o cadastro no momento.' };
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase.signOut();
    } catch {
      // Keep local cleanup even when Supabase sign-out fails.
    }

    this.clearUser();
  }

  private async restoreSupabaseSession(): Promise<void> {
    try {
      const { data } = await this.supabase.getSession();
      if (data.session?.user) {
        this.setUser(this.mapSupabaseUser(data.session.user));
      }
    } catch {
      // Ignore session restoration failures and keep local fallback state.
    }
  }

  private mapSupabaseUser(user: {
    id: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  }): AuthUser {
    const metadata = this.supabase.toUserMetadata(user as never);
    const rawProvider = String(user.app_metadata?.['provider'] ?? 'email');
    const provider: AuthProvider = rawProvider === 'google' ? 'google' : 'email';

    return {
      id: user.id,
      name: metadata.fullName || String(user.user_metadata?.['name'] ?? user.email ?? 'Aluno FullDev'),
      email: user.email ?? '',
      avatarUrl: (user.user_metadata?.['avatar_url'] as string | null | undefined) ?? null,
      provider,
      whatsappNumber: metadata.whatsappNumber,
      age: typeof metadata.age === 'number' ? metadata.age : null,
      technicalLevel: this.toTechnicalLevel(metadata.technicalLevel),
      educationInstitution: metadata.educationInstitution,
      acceptedTerms: metadata.acceptedTerms,
      acceptedTermsAt: metadata.acceptedTermsAt || null
    };
  }

  private toTechnicalLevel(value: unknown): TechnicalLevel | null {
    return value === 'iniciante' || value === 'intermediario' || value === 'avancado' ? value : null;
  }

  private async tryUpsertProfile(profile: Record<string, unknown>): Promise<void> {
    try {
      await this.supabase.upsertProfile(profile);
    } catch {
      // The profiles table may not exist yet. Auth should continue working without it.
    }
  }

  private normalizeSupabaseAuthError(message: string): string {
    if (message.toLowerCase().includes('invalid login credentials')) {
      return 'E-mail ou senha invalidos.';
    }

    if (message.toLowerCase().includes('email not confirmed')) {
      return 'Confirme seu e-mail antes de entrar.';
    }

    if (message.toLowerCase().includes('user already registered')) {
      return 'Ja existe uma conta com este e-mail.';
    }

    return message;
  }

  private setUser(user: AuthUser): void {
    this.userState.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    }
  }

  private clearUser(): void {
    this.userState.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  private readUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

}
