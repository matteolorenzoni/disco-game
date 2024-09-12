import { Routes } from '@angular/router';
import { userTypeGuard } from './user-type.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('../page/login/login.component').then((m) => m.LoginComponent) },
  { path: 'sign-up', loadComponent: () => import('../page/sign-up/sign-up.component').then((m) => m.SignUpComponent) },
  {
    path: 'admin',
    canActivate: [userTypeGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../page/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  {
    path: 'user',
    canActivate: [userTypeGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../page/user/dashboard/dashboard.component').then((m) => m.DashboardComponent)
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
