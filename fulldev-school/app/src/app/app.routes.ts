import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestOnlyGuard } from './guards/guest-only.guard';
import { profileCompletionGuard } from './guards/profile-completion.guard';
import { profileCompletionRequiredGuard } from './guards/profile-completion-required.guard';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { CourseOverviewComponent } from './pages/course-overview/course-overview.component';
import { LandingPageComponent } from './pages/landing-page.component';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';
import { LegalPageComponent } from './pages/legal-page/legal-page.component';
import { LessonPageComponent } from './pages/lesson-page/lesson-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { ModulePageComponent } from './pages/module-page/module-page.component';
import { ProfileCompletionPageComponent } from './pages/profile-completion-page/profile-completion-page.component';
import { PlatformDashboardComponent } from './pages/platform-dashboard/platform-dashboard.component';
import { PlatformHomeComponent } from './pages/platform-home/platform-home.component';
import { CourseShellComponent } from './shells/course-shell.component';
import { PlatformShellComponent } from './shells/platform-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [guestOnlyGuard],
    component: LoginPageComponent
  },
  {
    path: 'complete-profile',
    canActivate: [authGuard, profileCompletionRequiredGuard],
    component: ProfileCompletionPageComponent
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
    canActivate: [authGuard, profileCompletionGuard],
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
    canActivate: [authGuard, profileCompletionGuard],
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
    component: NotFoundPageComponent
  }
];
