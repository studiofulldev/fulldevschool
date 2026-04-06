import { Routes } from '@angular/router';
import { LessonPageComponent } from './pages/lesson-page.component';
import { ReaderComponent } from './pages/reader/reader.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'reader',
    component: ReaderComponent
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
