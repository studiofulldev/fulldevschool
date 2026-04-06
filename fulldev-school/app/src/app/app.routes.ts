import { Routes } from '@angular/router';
import { LessonPageComponent } from './pages/lesson-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'comece-aqui'
  },
  {
    path: ':slug',
    component: LessonPageComponent
  },
  {
    path: '**',
    redirectTo: 'comece-aqui'
  }
];
