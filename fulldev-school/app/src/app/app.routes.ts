import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { AccountPageComponent } from './pages/account-page.component';
import { LegalPageComponent } from './pages/legal-page.component';
import { LessonPageComponent } from './pages/lesson-page.component';
import { LoginPageComponent } from './pages/login-page.component';
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
    path: 'login',
    component: LoginPageComponent
  },
  {
    path: 'legal/privacy',
    component: LegalPageComponent,
    data: {
      document: 'privacy'
    }
  },
  {
    path: 'legal/terms',
    component: LegalPageComponent,
    data: {
      document: 'terms'
    }
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
        canActivate: [authGuard],
        component: AccountPageComponent
      }
    ]
  },
  {
    path: 'courses/:courseSlug',
    canActivate: [authGuard],
    component: CourseShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'lessons/visao-geral-do-guia',
        pathMatch: 'full'
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
    redirectTo: 'courses/home'
  }
];
