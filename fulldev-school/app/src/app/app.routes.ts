import { Routes } from '@angular/router';
import { LessonPageComponent } from './pages/lesson-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: ':slug',
    component: LessonPageComponent
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
