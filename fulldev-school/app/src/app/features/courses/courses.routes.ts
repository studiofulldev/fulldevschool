import { Routes } from '@angular/router';
import { CourseContentPageComponent } from './course-content.page';
import { CourseDetailPageComponent } from './course-detail.page';
import { CoursesExplorePageComponent } from './courses-explore.page';

export const coursesRoutes: Routes = [
  { path: '', component: CoursesExplorePageComponent },
  { path: ':courseSlug', component: CourseDetailPageComponent },
  { path: ':courseSlug/content', component: CourseContentPageComponent }
];

