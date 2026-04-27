import { Routes } from '@angular/router';
import { MentorProfilePageComponent } from './mentor-profile.page';
import { MentorsListPageComponent } from './mentors-list.page';

export const mentoringRoutes: Routes = [
  { path: '', component: MentorsListPageComponent },
  { path: ':mentorId', component: MentorProfilePageComponent }
];

