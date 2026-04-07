import { Injectable, computed, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  provider: 'google' | 'email';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'fulldev-school.auth.user';
  private readonly userState = signal<AuthUser | null>(this.readUser());

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  signInWithGoogle(): void {
    this.setUser({
      id: 'google-demo-user',
      name: 'Aluno FullDev',
      email: 'aluno@fulldev.com.br',
      avatarUrl: null,
      provider: 'google'
    });
  }

  signInWithEmail(name: string, email: string): void {
    this.setUser({
      id: this.slugify(email || name || 'user'),
      name: name.trim() || 'Aluno FullDev',
      email: email.trim() || 'aluno@fulldev.com.br',
      avatarUrl: null,
      provider: 'email'
    });
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

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
