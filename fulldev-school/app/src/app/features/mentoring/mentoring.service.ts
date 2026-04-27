import { Injectable } from '@angular/core';
import { MentorDetail, MentorSummary } from './mentoring.models';
import { MOCK_MENTORS } from './mentoring.mock';

@Injectable({ providedIn: 'root' })
export class MentoringService {
  private readonly mentors = MOCK_MENTORS;

  list(): MentorSummary[] {
    return this.mentors.map(({ availability, socials, experience, ...summary }) => summary);
  }

  getById(id: string): MentorDetail | null {
    return this.mentors.find((m) => m.id === id) ?? null;
  }
}

