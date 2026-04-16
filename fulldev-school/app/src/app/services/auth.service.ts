import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoggerService } from './logger.service';
import { OAuthProvider, SupabaseService } from './supabase.service';
import { TrackingService } from './tracking.service';

export type AuthProvider = OAuthProvider | 'email';
export type TechnicalLevel =
  | 'estudante'
  | 'estagiario'
  | 'junior'
  | 'pleno'
  | 'senior'
  | 'lead'
  | 'staff'
  | 'principal';
export type AppRole = 'admin' | 'instructor' | 'user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  provider: AuthProvider;
  role: AppRole;
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

export interface OAuthProfileCompletionPayload {
  name: string;
  whatsappNumber?: string;
  age: number | null;
  technicalLevel: TechnicalLevel | null;
  educationInstitution?: string;
  acceptedTerms: boolean;
}

export interface AuthActionResult {
  ok: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly logger = inject(LoggerService);
  private readonly supabase = inject(SupabaseService);
  private readonly tracking = inject(TrackingService);
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
    const cachedUser = this.cachedDisplayUser;
    const verifiedUser = this.verifiedUserState();

    if (!this.sessionCheckCompleteState()) {
      return cachedUser;
    }

    if (!verifiedUser) {
      return null;
    }

    if (!cachedUser) {
      return verifiedUser;
    }

    return {
      ...cachedUser,
      ...verifiedUser,
      avatarUrl: verifiedUser.avatarUrl ?? cachedUser.avatarUrl ?? null,
      name: verifiedUser.name || cachedUser.name,
      email: verifiedUser.email || cachedUser.email,
      whatsappNumber: verifiedUser.whatsappNumber || cachedUser.whatsappNumber,
      educationInstitution: verifiedUser.educationInstitution || cachedUser.educationInstitution,
      acceptedTermsAt: verifiedUser.acceptedTermsAt || cachedUser.acceptedTermsAt || null
    };
  });

  // Auth decisions are based solely on the verified user.
  readonly isAuthenticated = computed(() => this.verifiedUserState() !== null && this.sessionCheckCompleteState());
  readonly isAdmin = computed(() => this.verifiedUserState()?.role === 'admin');
  readonly isInstructor = computed(() => this.verifiedUserState()?.role === 'instructor');
  readonly isCommonUser = computed(() => this.verifiedUserState()?.role === 'user');

  constructor() {
    // Safety net: if INITIAL_SESSION never fires (private browsing with blocked
    // storage, GoTrue network timeout), unblock guards after 5 seconds so the
    // user sees the login page instead of a blank screen.
    const sessionTimeout = setTimeout(
      () => this.markSessionCheckComplete(),
      5000
    );

    this.supabase.onAuthStateChange(async ({ session, event }) => {
      clearTimeout(sessionTimeout);
      const supabaseUser = session?.user;
      if (!supabaseUser) {
        this.verifiedUserState.set(null);
        this.clearUserCache();
      } else {
        const authUser = this.mapSupabaseUser(supabaseUser);
        this.verifiedUserState.set(authUser);
        this.cacheUser(authUser);
        this.markSessionCheckComplete();
        void this.syncUserRecords(authUser);

        if (event === 'INITIAL_SESSION') {
          const isFirst = this.isFirstSession(authUser);
          this.tracking.trackSessionStarted(authUser, isFirst);
        }
      }

      // Mark session check complete on any auth event after INITIAL_SESSION.
      if (event === 'INITIAL_SESSION' || !this.sessionCheckCompleteState()) {
        this.markSessionCheckComplete();
      }
    });
  }

  async signInWithGoogle(): Promise<AuthActionResult> {
    return this.signInWithOAuth('google');
  }

  async signInWithLinkedIn(): Promise<AuthActionResult> {
    return this.signInWithOAuth('linkedin_oidc');
  }

  private async signInWithOAuth(provider: OAuthProvider): Promise<AuthActionResult> {
    const providerLabel = provider === 'google' ? 'Google' : 'LinkedIn';

    try {
      const { data, error } = await this.supabase.signInWithOAuth(provider);
      if (error) {
        return { ok: false, message: error.message };
      }

      if (!data.url) {
        return { ok: false, message: `Nao foi possivel iniciar o login com ${providerLabel}.` };
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
      this.markSessionCheckComplete();
      void this.syncUserRecords(authUser);
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
      accepted_terms_at: acceptedAt,
      app_role: 'user'
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
          role: 'user',
          accepted_terms: true,
          accepted_terms_at: acceptedAt,
          updated_at: acceptedAt
        });

        await this.tryUpsertLead({
          email,
          name,
          provider: 'email',
          profile_id: data.user.id,
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
    this.tracking.resetSession();
  }

  requiresProfileCompletion(user: AuthUser | null = this.verifiedUserState()): boolean {
    if (!user || user.provider === 'email') {
      return false;
    }

    return !user.age || !user.technicalLevel || !user.acceptedTerms;
  }

  async completeOAuthProfile(payload: OAuthProfileCompletionPayload): Promise<AuthActionResult> {
    const user = this.verifiedUserState();
    if (!user) {
      return { ok: false, message: 'Sessao nao encontrada.' };
    }

    const name = payload.name.trim();
    const whatsappNumber = payload.whatsappNumber?.trim() || '';
    const educationInstitution = payload.educationInstitution?.trim() || '';

    if (!name || !payload.age || !payload.technicalLevel) {
      return { ok: false, message: 'Preencha todos os campos obrigatorios.' };
    }

    if (!payload.acceptedTerms) {
      return { ok: false, message: 'Voce precisa aceitar os termos para continuar.' };
    }

    const acceptedAt = user.acceptedTermsAt || new Date().toISOString();
    const metadata = {
      full_name: name,
      whatsapp_number: whatsappNumber,
      age: payload.age,
      technical_level: payload.technicalLevel,
      education_institution: educationInstitution,
      accepted_terms: true,
      accepted_terms_at: acceptedAt,
      app_role: user.role
    };

    try {
      const { data, error } = await this.supabase.updateUserMetadata(metadata);
      if (error) {
        return { ok: false, message: error.message };
      }

      await this.tryUpsertProfile({
        id: user.id,
        email: user.email,
        full_name: name,
        whatsapp_number: whatsappNumber,
        age: payload.age,
        technical_level: payload.technicalLevel,
        education_institution: educationInstitution,
        avatar_url: user.avatarUrl ?? null,
        provider: user.provider,
        role: user.role,
        accepted_terms: true,
        accepted_terms_at: acceptedAt,
        updated_at: new Date().toISOString()
      });

      const nextUser = data.user ? this.mapSupabaseUser(data.user) : {
        ...user,
        name,
        whatsappNumber,
        age: payload.age,
        technicalLevel: payload.technicalLevel,
        educationInstitution,
        acceptedTerms: true,
        acceptedTermsAt: acceptedAt
      };

      this.verifiedUserState.set(nextUser);
      this.cacheUser(nextUser);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Nao foi possivel salvar seus dados agora.' };
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
    const provider: AuthProvider =
      rawProvider === 'google' || rawProvider === 'linkedin_oidc'
        ? rawProvider
        : 'email';

    return {
      id: user.id,
      name: metadata.fullName || String(user.user_metadata?.['name'] ?? user.email ?? 'Aluno FullDev'),
      email: user.email ?? '',
      avatarUrl: this.sanitizeAvatarUrl(user.user_metadata?.['avatar_url']),
      provider,
      role: this.toAppRole(metadata.role),
      whatsappNumber: metadata.whatsappNumber,
      age: typeof metadata.age === 'number' ? metadata.age : null,
      technicalLevel: this.toTechnicalLevel(metadata.technicalLevel),
      educationInstitution: metadata.educationInstitution,
      acceptedTerms: metadata.acceptedTerms,
      acceptedTermsAt: metadata.acceptedTermsAt || null
    };
  }

  private toTechnicalLevel(value: unknown): TechnicalLevel | null {
    return value === 'estudante' ||
      value === 'estagiario' ||
      value === 'junior' ||
      value === 'pleno' ||
      value === 'senior' ||
      value === 'lead' ||
      value === 'staff' ||
      value === 'principal'
      ? value
      : null;
  }

  private toAppRole(value: unknown): AppRole {
    return value === 'admin' || value === 'instructor' ? value : 'user';
  }

  hasRole(role: AppRole | AppRole[], user: AuthUser | null = this.verifiedUserState()): boolean {
    if (!user) {
      return false;
    }

    return Array.isArray(role) ? role.includes(user.role) : user.role === role;
  }

  // Allow only HTTPS avatar URLs from known trusted providers.
  // Rejects data URIs, javascript: URLs, and unknown origins.
  private sanitizeAvatarUrl(value: unknown): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') {
        return null;
      }

      const allowedHosts = [
        'lh3.googleusercontent.com',
        'lh4.googleusercontent.com',
        'lh5.googleusercontent.com',
        'lh6.googleusercontent.com',
        'avatars.githubusercontent.com',
        'media.licdn.com'
      ];

      const isAllowed =
        allowedHosts.includes(url.hostname) ||
        url.hostname.endsWith('.supabase.co');

      return isAllowed ? value : null;
    } catch {
      return null;
    }
  }

  private async tryUpsertProfile(profile: Record<string, unknown>): Promise<void> {
    try {
      await this.supabase.upsertProfile(profile);
    } catch (err) {
      // The profiles table may not exist yet. Auth should continue working without it.
      this.logger.error('AuthService', 'tryUpsertProfile failed', err);
    }
  }

  private async tryUpsertLead(lead: Record<string, unknown>): Promise<void> {
    try {
      await this.supabase.upsertLead(lead);
    } catch (err) {
      // The leads table may not exist yet. Auth should continue working without it.
      this.logger.error('AuthService', 'tryUpsertLead failed', err);
    }
  }

  private async syncUserRecords(user: AuthUser): Promise<void> {
    const timestamp = new Date().toISOString();
    const fullName = user.name.trim() || user.email || 'Lead FullDev';

    await this.tryUpsertProfile({
      id: user.id,
      email: user.email,
      full_name: fullName,
      whatsapp_number: user.whatsappNumber?.trim() || '',
      age: user.age ?? null,
      technical_level: user.technicalLevel ?? null,
      education_institution: user.educationInstitution?.trim() || '',
      avatar_url: user.avatarUrl ?? null,
      provider: user.provider,
      role: user.role,
      accepted_terms: Boolean(user.acceptedTerms),
      accepted_terms_at: user.acceptedTermsAt ?? null,
      updated_at: timestamp
    });

    if (user.email) {
      await this.tryUpsertLead({
        email: user.email,
        name: fullName,
        provider: user.provider,
        profile_id: user.id,
        updated_at: timestamp
      });
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

  private isFirstSession(user: AuthUser): boolean {
    const key = `fulldev-school.tracking.first-session.${user.id}`;
    if (typeof localStorage === 'undefined') {
      return false;
    }

    const isFirst = !localStorage.getItem(key);
    if (isFirst) {
      localStorage.setItem(key, 'true');
    }

    return isFirst;
  }

  private markSessionCheckComplete(): void {
    if (!this.sessionCheckCompleteState()) {
      this.sessionCheckCompleteState.set(true);
    }
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
