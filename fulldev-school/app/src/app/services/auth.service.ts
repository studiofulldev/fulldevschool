import { Injectable, computed, signal } from '@angular/core';

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

interface StoredAccount extends AuthUser {
  password: string;
}

interface EmailLead {
  email: string;
  fullName: string;
  source: 'signup' | 'google';
  acceptedAt: string;
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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'fulldev-school.auth.user';
  private readonly accountsKey = 'fulldev-school.auth.accounts';
  private readonly emailLeadsKey = 'fulldev-school.email-leads';
  private readonly userState = signal<AuthUser | null>(this.readUser());

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  signInWithGoogle(): void {
    const timestamp = new Date().toISOString();
    const existing = this.findAccountByEmail('aluno@fulldev.com.br');
    const user: AuthUser = existing ?? {
      id: 'google-demo-user',
      name: 'Aluno FullDev',
      email: 'aluno@fulldev.com.br',
      avatarUrl: null,
      provider: 'google',
      technicalLevel: 'iniciante',
      acceptedTerms: true,
      acceptedTermsAt: timestamp
    };

    this.upsertAccount({
      ...user,
      password: existing?.password ?? ''
    });
    this.upsertEmailLead({
      email: user.email,
      fullName: user.name,
      source: 'google',
      acceptedAt: user.acceptedTermsAt ?? timestamp
    });
    this.setUser(user);
  }

  signInWithEmail(email: string, password: string): { ok: boolean; message?: string } {
    const account = this.findAccountByEmail(email);
    if (!account) {
      return { ok: false, message: 'Nenhum cadastro encontrado para este e-mail.' };
    }

    if (account.password !== password) {
      return { ok: false, message: 'Senha incorreta.' };
    }

    this.setUser(this.toPublicUser(account));
    return { ok: true };
  }

  registerWithEmail(payload: EmailRegistrationPayload): { ok: boolean; message?: string } {
    const email = payload.email.trim().toLowerCase();
    const name = payload.name.trim();
    const password = payload.password.trim();

    if (!payload.acceptedTerms) {
      return { ok: false, message: 'Voce precisa aceitar os termos para continuar.' };
    }

    if (!name || !email || !password || !payload.technicalLevel || !payload.age) {
      return { ok: false, message: 'Preencha todos os campos obrigatorios.' };
    }

    if (this.findAccountByEmail(email)) {
      return { ok: false, message: 'Ja existe uma conta com este e-mail.' };
    }

    const acceptedAt = new Date().toISOString();
    const account: StoredAccount = {
      id: this.slugify(email),
      name,
      email,
      password,
      avatarUrl: null,
      provider: 'email',
      whatsappNumber: payload.whatsappNumber?.trim() || '',
      age: payload.age,
      technicalLevel: payload.technicalLevel,
      educationInstitution: payload.educationInstitution?.trim() || '',
      acceptedTerms: true,
      acceptedTermsAt: acceptedAt
    };

    this.upsertAccount(account);
    this.upsertEmailLead({
      email: account.email,
      fullName: account.name,
      source: 'signup',
      acceptedAt
    });
    this.setUser(this.toPublicUser(account));
    return { ok: true };
  }

  signOut(): void {
    this.userState.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  private setUser(user: AuthUser): void {
    this.userState.set(user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(user));
    }
  }

  private findAccountByEmail(email: string): StoredAccount | null {
    const normalized = email.trim().toLowerCase();
    return this.readAccounts().find((account) => account.email.toLowerCase() === normalized) ?? null;
  }

  private upsertAccount(account: StoredAccount): void {
    const accounts = this.readAccounts();
    const next = accounts.filter((item) => item.email.toLowerCase() !== account.email.toLowerCase());
    next.push(account);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.accountsKey, JSON.stringify(next));
    }
  }

  private upsertEmailLead(lead: EmailLead): void {
    const leads = this.readEmailLeads();
    const next = leads.filter((item) => item.email.toLowerCase() !== lead.email.toLowerCase());
    next.push(lead);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.emailLeadsKey, JSON.stringify(next));
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

  private readAccounts(): StoredAccount[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.accountsKey);
      return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
    } catch {
      return [];
    }
  }

  private readEmailLeads(): EmailLead[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.emailLeadsKey);
      return raw ? (JSON.parse(raw) as EmailLead[]) : [];
    } catch {
      return [];
    }
  }

  private toPublicUser(account: StoredAccount): AuthUser {
    const { password: _password, ...user } = account;
    return user;
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
