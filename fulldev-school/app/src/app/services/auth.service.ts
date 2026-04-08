import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
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

  // Verified user — only set after Supabase confirms the session.
  // This is the source of truth for authentication decisions.
  private readonly verifiedUserState = signal<AuthUser | null>(null);

  // Cached display data from localStorage — used only to pre-populate name/avatar
  // while the Supabase session check is in progress. Never used for auth decisions.
  private readonly cachedDisplayUser: AuthUser | null = this.readUser();

  // True once the initial Supabase session check has completed (success or failure).
  private readonly sessionCheckCompleteState = signal(false);
  readonly sessionCheckComplete = this.sessionCheckCompleteState.asReadonly();

  // Emit once when sessionCheckComplete flips to true.
  readonly sessionCheckComplete$: Observable<true> = toObservable(this.sessionCheckCompleteState).pipe(
    filter(Boolean),
    take(1),
    map(() => true as const)
  );

  // Display user: shows cached data while loading, then the verified user (or null).
  readonly user = computed<AuthUser | null>(() => {
    if (!this.sessionCheckCompleteState()) {
      return this.cachedDisplayUser;
    }
    return this.verifiedUserState();
  });

  // Auth decisions are based solely on the verified user.
  readonly isAuthenticated = computed(() => this.verifiedUserState() !== null && this.sessionCheckCompleteState());

  constructor() {
    void this.restoreSupabaseSession();

    this.supabase.onAuthStateChange(({ session, event }) => {
      const supabaseUser = session?.user;
      if (!supabaseUser) {
        this.verifiedUserState.set(null);
        this.clearUserCache();
      } else {
        const authUser = this.mapSupabaseUser(supabaseUser);
        this.verifiedUserState.set(authUser);
        this.cacheUser(authUser);
      }

      // Mark session check complete on any auth event after INITIAL_SESSION.
      if (event === 'INITIAL_SESSION' || !this.sessionCheckCompleteState()) {
        this.sessionCheckCompleteState.set(true);
      }
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
      const { data, error } = await this.supabase.signInWithPassword(email.trim().toLowerCase(), password);
      if (error) {
        return { ok: false, message: this.normalizeSupabaseAuthError(error.message) };
      }

      if (!data.user) {
        return { ok: false, message: 'Nao foi possivel iniciar a sessao.' };
      }

      const authUser = this.mapSupabaseUser(data.user);
      this.verifiedUserState.set(authUser);
      this.cacheUser(authUser);
      this.sessionCheckCompleteState.set(true);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Nao foi possivel validar sua conta no momento.' };
    }
  }

  async registerWithEmail(payload: EmailRegistrationPayload): Promise<AuthActionResult> {
    const email = payload.email.trim().toLowerCase();
    const name = payload.name.trim();
    const password = payload.password;

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

        const authUser = this.mapSupabaseUser(data.user);
        this.verifiedUserState.set(authUser);
        this.cacheUser(authUser);
        this.sessionCheckCompleteState.set(true);
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

    this.verifiedUserState.set(null);
    this.clearUserCache();
  }

  private async restoreSupabaseSession(): Promise<void> {
    try {
      const { data } = await this.supabase.getSession();
      if (data.session?.user) {
        const authUser = this.mapSupabaseUser(data.session.user);
        this.verifiedUserState.set(authUser);
        this.cacheUser(authUser);
      }
    } catch {
      // Session restoration failed — keep verifiedUserState as null.
    } finally {
      this.sessionCheckCompleteState.set(true);
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

  private cacheUser(user: AuthUser): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    }
  }

  private clearUserCache(): void {
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
