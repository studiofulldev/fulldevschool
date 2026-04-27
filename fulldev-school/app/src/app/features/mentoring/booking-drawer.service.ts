import { Injectable, signal } from '@angular/core';
import { MentorSummary } from './mentoring.models';

export interface BookingSelection {
  mentor: MentorSummary;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

@Injectable({ providedIn: 'root' })
export class BookingDrawerService {
  private readonly selectionState = signal<BookingSelection | null>(null);
  readonly selection = this.selectionState.asReadonly();

  select(selection: BookingSelection): void {
    this.selectionState.set(selection);
  }

  clear(): void {
    this.selectionState.set(null);
  }
}

