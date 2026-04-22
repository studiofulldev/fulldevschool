import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export type ReviewerLevel =
  | 'dev_em_formacao'
  | 'code_reviewer'
  | 'senior_reviewer'
  | 'tech_lead'
  | 'fulldev_fellow';

interface LevelEntry {
  min: number;
  level: ReviewerLevel;
  next: number | null;
}

const LEVEL_MAP: LevelEntry[] = [
  { min: 700, level: 'fulldev_fellow', next: null },
  { min: 350, level: 'tech_lead', next: 700 },
  { min: 150, level: 'senior_reviewer', next: 350 },
  { min: 50, level: 'code_reviewer', next: 150 },
  { min: 0, level: 'dev_em_formacao', next: 50 },
];

export function resolveLevel(points: number): ReviewerLevel {
  for (const entry of LEVEL_MAP) {
    if (points >= entry.min) return entry.level;
  }
  return 'dev_em_formacao';
}

export function resolveNextThreshold(points: number): number | null {
  for (const entry of LEVEL_MAP) {
    if (points >= entry.min) return entry.next;
  }
  return 50;
}

@Injectable({ providedIn: 'root' })
export class MentorPointsService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);

  private readonly _points = signal(0);

  readonly points = this._points.asReadonly();
  readonly level = computed(() => resolveLevel(this._points()));
  readonly nextThreshold = computed(() => resolveNextThreshold(this._points()));

  async loadPoints(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const { data } = await this.supabase.client!
      .from('profiles')
      .select('mentor_points')
      .eq('id', user.id)
      .single();

    if (data?.mentor_points != null) {
      this._points.set(data.mentor_points);
    }
  }
}
