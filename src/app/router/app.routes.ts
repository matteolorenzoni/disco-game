import { Routes } from '@angular/router';
import { userGuard } from './user.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [userGuard],
    loadComponent: () => import('../page/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'sign-up',
    children: [
      {
        path: '',
        loadComponent: () => import('../page/register/sign-up/sign-up.component').then((m) => m.SignUpComponent)
      },
      {
        path: 'privacy-policy',
        loadComponent: () =>
          import('../page/register/privacy-policy/privacy-policy.component').then((m) => m.PrivacyPolicyComponent)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [userGuard],
    loadComponent: () => import('../page/home/home.component').then((m) => m.HomeComponent),
    children: [
      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('../page/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },

      // Eventi
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
            loadComponent: () =>
              import('../page/admin/event-create/event-create.component').then((m) => m.EventCreateComponent)
          },
          {
            path: ':eventId/challenges',
            loadComponent: () =>
              import('../page/admin/event-challenge/event-challenge.component').then((m) => m.EventChallengeComponent)
          },

          {
            path: ':eventId/teams',
            loadComponent: () =>
              import('../page/admin/event-team/event-team.component').then((m) => m.EventTeamComponent)
          }
        ]
      },

      // Sfide
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
            path: ':challengeId',
            loadComponent: () =>
              import('../page/admin/challenge-create/challenge-create.component').then(
                (m) => m.ChallengeCreateComponent
              )
          }
        ]
      },

      // Classifiche
      {
        path: 'leaderboards',
        loadComponent: () =>
          import('../page/user/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent)
      },

      // Impostazioni
      {
        path: 'settings',
        loadComponent: () => import('../page/settings/settings.component').then((m) => m.SettingsComponent)
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
        loadComponent: () => import('../page/settings/settings.component').then((m) => m.SettingsComponent)
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
            path: ':eventId/team/:teamId',
            loadComponent: () => import('../page/user/team/team.component').then((m) => m.TeamComponent)
          },
          {
            path: ':eventId/team/:teamId/teammate/:teammateId',
            loadComponent: () => import('../page/user/user-team/user-team.component').then((m) => m.UserTeamComponent)
          },
          {
            path: ':eventId/team/:teamId/challenge/:challengeId',
            loadComponent: () => import('../page/user/challenge/challenge.component').then((m) => m.ChallengeComponent)
          }
        ]
      },

      // Classifiche
      {
        path: 'leaderboards',
        loadComponent: () =>
          import('../page/user/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent)
      },

      // Impostazioni
      {
        path: 'settings',
        loadComponent: () => import('../page/settings/settings.component').then((m) => m.SettingsComponent)
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
