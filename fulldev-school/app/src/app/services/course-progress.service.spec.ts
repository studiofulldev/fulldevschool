import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CourseProgressService } from './course-progress.service';

describe('CourseProgressService', () => {
  let service: CourseProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseProgressService);
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('lesson progress', () => {
    it('returns false for a lesson that was never marked', () => {
      expect(service.isLessonCompleted('course-start', 'lesson-1')).toBe(false);
    });

    it('returns true after marking a lesson as completed', () => {
      service.setLessonCompleted('course-start', 'lesson-1', true);
      expect(service.isLessonCompleted('course-start', 'lesson-1')).toBe(true);
    });

    it('returns false after marking a previously completed lesson as not completed', () => {
      service.setLessonCompleted('course-start', 'lesson-1', true);
      service.setLessonCompleted('course-start', 'lesson-1', false);
      expect(service.isLessonCompleted('course-start', 'lesson-1')).toBe(false);
    });

    it('does not affect other lessons in the same course', () => {
      service.setLessonCompleted('course-start', 'lesson-1', true);
      expect(service.isLessonCompleted('course-start', 'lesson-2')).toBe(false);
    });

    it('does not affect lessons in a different course', () => {
      service.setLessonCompleted('course-start', 'lesson-1', true);
      expect(service.isLessonCompleted('course-advanced', 'lesson-1')).toBe(false);
    });

    it('persists lesson state to localStorage', () => {
      service.setLessonCompleted('course-start', 'lesson-1', true);
      const raw = localStorage.getItem('fulldev-school.progress.lessons');
      expect(raw).not.toBeNull();
      const state = JSON.parse(raw!);
      expect(state['course-start::lesson::lesson-1']).toBe(true);
    });
  });

  describe('module progress', () => {
    it('returns false for a module that was never marked', () => {
      expect(service.isModuleCompleted('course-start', 'module-1')).toBe(false);
    });

    it('returns true after marking a module as completed', () => {
      service.setModuleCompleted('course-start', 'module-1', true);
      expect(service.isModuleCompleted('course-start', 'module-1')).toBe(true);
    });

    it('stores module and lesson progress independently', () => {
      service.setModuleCompleted('course-start', 'module-1', true);
      expect(service.isLessonCompleted('course-start', 'module-1')).toBe(false);
    });
  });

  describe('course progress', () => {
    it('returns false for a course that was never marked', () => {
      expect(service.isCourseCompleted('course-start')).toBe(false);
    });

    it('returns true after marking a course as completed', () => {
      service.setCourseCompleted('course-start', true);
      expect(service.isCourseCompleted('course-start')).toBe(true);
    });

    it('does not affect other courses', () => {
      service.setCourseCompleted('course-start', true);
      expect(service.isCourseCompleted('course-advanced')).toBe(false);
    });
  });

  describe('state isolation', () => {
    it('lesson, module and course share no storage keys', () => {
      service.setLessonCompleted('x', 'y', true);
      service.setModuleCompleted('x', 'y', true);
      service.setCourseCompleted('x', true);

      const lessonRaw = localStorage.getItem('fulldev-school.progress.lessons');
      const moduleRaw = localStorage.getItem('fulldev-school.progress.modules');
      const courseRaw = localStorage.getItem('fulldev-school.progress.courses');

      expect(lessonRaw).not.toBeNull();
      expect(moduleRaw).not.toBeNull();
      expect(courseRaw).not.toBeNull();
      expect(lessonRaw).not.toBe(moduleRaw);
      expect(moduleRaw).not.toBe(courseRaw);
    });
  });
});
