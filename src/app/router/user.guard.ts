import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { AuthService } from '../service/auth.service';
import { UserType } from '../model/user.model';

export const userGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Usa l'Observable e filtra i valori undefined
    const user = await firstValueFrom(authService.userAsObservable());

    // Verifica il tipo di utente
    const currentUserType = user?.type;

    if (state.url.startsWith('/login')) {
      switch (currentUserType) {
        case UserType.ADMIN:
          await router.navigate(['/admin']);
          break;
        case UserType.USER:
          await router.navigate(['/user']);
          break;
        default:
          break;
      }
    }

    if (state.url.startsWith('/admin') && currentUserType !== UserType.ADMIN) {
      await router.navigate(['/unauthorized']);
      return false;
    }

    if (state.url.startsWith('/user') && currentUserType !== UserType.USER) {
      await router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  } catch {
    await router.navigate(['/login']);
    return false;
  }
};
