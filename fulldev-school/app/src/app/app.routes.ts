import { Routes } from '@angular/router';
import { AccountPageComponent } from './pages/account-page.component';
import { CourseOverviewComponent } from './pages/course-overview.component';
import { LessonPageComponent } from './pages/lesson-page.component';
import { ModulePageComponent } from './pages/module-page.component';
import { PlatformDashboardComponent } from './pages/platform-dashboard.component';
import { PlatformHomeComponent } from './pages/platform-home.component';
import { CourseShellComponent } from './shells/course-shell.component';
import { PlatformShellComponent } from './shells/platform-shell.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'courses',
    pathMatch: 'full'
  },
  {
    path: 'courses',
    component: PlatformShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        component: PlatformDashboardComponent
      },
      {
        path: 'catalog',
        component: PlatformHomeComponent
      },
      {
        path: 'account',
        component: AccountPageComponent
      }
    ]
  },
  {
    path: 'courses/:courseSlug',
    component: CourseShellComponent,
    children: [
      {
        path: '',
        component: CourseOverviewComponent
      },
      {
        path: 'modules/:moduleSlug',
        component: ModulePageComponent
      },
      {
        path: 'lessons/:lessonSlug',
        component: LessonPageComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
