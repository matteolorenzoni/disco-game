import { Routes } from '@angular/router';
import { userGuard } from './user.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [userGuard],
    loadComponent: () => import('../page/login/login.component').then((m) => m.LoginComponent)
  },
  { path: 'sign-up', loadComponent: () => import('../page/sign-up/sign-up.component').then((m) => m.SignUpComponent) },
  {
    path: 'admin',
    canActivate: [userGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../page/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'events',
        children: [
          {
            path: 'new',
            loadComponent: () =>
              import('../page/admin/event-create/event-create.component').then((m) => m.EventCreateComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('../page/admin/event-create/event-create.component').then((m) => m.EventCreateComponent)
          },
          {
            path: '',
            loadComponent: () =>
              import('../page/admin/event-list/event-list.component').then((m) => m.EventListComponent)
          }
        ]
      },
      {
        path: 'challenges',
        children: [
          {
            path: 'new',
            loadComponent: () =>
              import('../page/admin/challenge-create/challenge-create.component').then(
                (m) => m.ChallengeCreateComponent
              )
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('../page/admin/challenge-create/challenge-create.component').then(
                (m) => m.ChallengeCreateComponent
              )
          },
          {
            path: '',
            loadComponent: () =>
              import('../page/admin/challenge-list/challenge-list.component').then((m) => m.ChallengeListComponent)
          }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  {
    path: 'user',
    canActivate: [userGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../page/user/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'teams',
        children: [
          {
            path: 'new',
            loadComponent: () =>
              import('../page/user/team-create/team-create.component').then((m) => m.TeamCreateComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('../page/user/team-create/team-create.component').then((m) => m.TeamCreateComponent)
          }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('../page/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent)
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
