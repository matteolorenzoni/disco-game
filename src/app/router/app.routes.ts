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
    loadComponent: () => import('../page/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../page/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'events',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../page/admin/event-list/event-list.component').then((m) => m.EventListComponent)
          },
          {
            path: 'new',
            loadComponent: () =>
              import('../page/admin/event-create/event-create.component').then((m) => m.EventCreateComponent)
          },
          {
            path: ':eventId',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('../page/admin/event-create/event-create.component').then((m) => m.EventCreateComponent)
              },
              {
                path: 'challenges',
                loadComponent: () =>
                  import('../page/admin/event-challenge/event-challenge.component').then(
                    (m) => m.EventChallengeComponent
                  )
              }
            ]
          }
        ]
      },
      {
        path: 'challenges',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../page/admin/challenge-list/challenge-list.component').then((m) => m.ChallengeListComponent)
          },
          {
            path: 'new',
            loadComponent: () =>
              import('../page/admin/challenge-create/challenge-create.component').then(
                (m) => m.ChallengeCreateComponent
              )
          },
          {
            path: ':id',
            loadComponent: () =>
              import('../page/admin/challenge-create/challenge-create.component').then(
                (m) => m.ChallengeCreateComponent
              )
          }
        ]
      },
      {
        path: 'settings',
        children: [
          {
            path: '',
            loadComponent: () => import('../page/settings/settings.component').then((m) => m.SettingsComponent)
          },
          {
            path: 'profile',
            loadComponent: () => import('../page/sign-up/sign-up.component').then((m) => m.SignUpComponent)
          }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  {
    path: 'scanner',
    canActivate: [userGuard],
    loadComponent: () => import('../page/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../page/scanner/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'settings',
        children: [
          {
            path: '',
            loadComponent: () => import('../page/settings/settings.component').then((m) => m.SettingsComponent)
          },
          {
            path: 'profile',
            loadComponent: () => import('../page/sign-up/sign-up.component').then((m) => m.SignUpComponent)
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
    loadComponent: () => import('../page/home/home.component').then((m) => m.HomeComponent),
    children: [
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('../page/user/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },

      // Eventi
      {
        path: 'events',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../page/user/event-list/event-list.component').then((m) => m.EventListComponent)
          },
          {
            path: ':eventId/:teamId/:teammateId',
            loadComponent: () => import('../page/user/user-team/user-team.component').then((m) => m.UserTeamComponent)
          },
          {
            path: ':eventId/:teamId',
            loadComponent: () => import('../page/user/team/team.component').then((m) => m.TeamComponent)
          }
        ]
      },

      // Sfide (non nel bottom menu)
      {
        path: 'challenges/:eventId/:teamId/:challengeId',
        loadComponent: () => import('../page/user/challenge/challenge.component').then((m) => m.ChallengeComponent)
      },

      // Classifiche
      {
        path: 'leaderboards',
        loadComponent: () =>
          import('../page/user/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent)
      },

      {
        path: 'challenges/:eventId/:teamId/:challengeId',
        loadComponent: () => import('../page/user/challenge/challenge.component').then((m) => m.ChallengeComponent)
      },

      // Impostazioni
      {
        path: 'settings',
        children: [
          {
            path: '',
            loadComponent: () => import('../page/settings/settings.component').then((m) => m.SettingsComponent)
          },
          {
            path: 'profile',
            loadComponent: () => import('../page/sign-up/sign-up.component').then((m) => m.SignUpComponent)
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
