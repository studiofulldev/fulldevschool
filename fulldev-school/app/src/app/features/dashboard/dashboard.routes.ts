import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';
import { profileCompletionGuard } from '../../guards/profile-completion.guard';
import { AccountPageComponent } from '../../pages/account-page/account-page.component';
import { DashboardShellComponent } from './dashboard-shell.component';
import { DashboardHomePageComponent } from './dashboard-home.page';

export const dashboardRoutes: Routes = [
  {
    path: 'app',
    canActivate: [authGuard, profileCompletionGuard],
    component: DashboardShellComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: DashboardHomePageComponent },
      {
        path: 'courses',
        loadChildren: () => import('../courses/courses.routes').then((m) => m.coursesRoutes)
      },
      {
        path: 'mentoring',
        loadChildren: () => import('../mentoring/mentoring.routes').then((m) => m.mentoringRoutes)
      },
      { path: 'profile', component: AccountPageComponent }
    ]
  }
];

