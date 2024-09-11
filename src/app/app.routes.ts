import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./page/login/login.component').then((m) => m.LoginComponent) },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirect di esempio
  { path: '**', redirectTo: '/login' } // Gestione di rotte non trovate
];
