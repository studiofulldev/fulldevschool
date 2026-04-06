import { Routes } from '@angular/router';
import { LessonPageComponent } from './pages/lesson-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LessonPageComponent
  },
  {
    path: ':slug',
    component: LessonPageComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
