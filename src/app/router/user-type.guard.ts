import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { UserType } from '../model/enum.model';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

export const userTypeGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Usa l'Observable e filtra i valori undefined
    const user = await firstValueFrom(authService.userAsObservable());

    // Verifica il tipo di utente
    const currentUserType = user?.type;

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
