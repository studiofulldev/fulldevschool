import { Injectable } from '@angular/core';
import { CourseDetail, CourseSummary } from './courses.models';
import { MOCK_COURSES } from './courses.mock';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly courses = MOCK_COURSES;

  list(params?: { query?: string; category?: string }): CourseSummary[] {
    const query = (params?.query ?? '').trim().toLowerCase();
    const category = (params?.category ?? '').trim().toLowerCase();

    return this.courses
      .filter((c) => (category ? c.category.toLowerCase() === category : true))
      .filter((c) => (query ? (c.title + ' ' + c.description).toLowerCase().includes(query) : true))
      .map(({ modules, longDescription, ...summary }) => summary);
  }

  getBySlug(slug: string): CourseDetail | null {
    return this.courses.find((c) => c.slug === slug) ?? null;
  }

  categories(): string[] {
    return Array.from(new Set(this.courses.map((c) => c.category))).sort();
  }
}

