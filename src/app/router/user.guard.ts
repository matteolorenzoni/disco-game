import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/internal/operators/filter';
import { UserService } from '../service/user.service';
import { FirebaseService } from '../service/firebase.service';
import { UserRole } from '../model/user.model';

export const userGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const firebaseService = inject(FirebaseService);
  const userService = inject(UserService);

  try {
    // Usa l'Observable di userFirebase e filtra i valori undefined
    const userFirebase = await firstValueFrom(
      toObservable(firebaseService.userFirebase).pipe(filter((user) => user !== undefined))
    );

    // Verifica se l'utente è già presente nel sistema, altrimenti lo recupera
    let user = await userService.user();
    if (!user && userFirebase) {
      user = await userService.getUserById(userFirebase.uid);
    }

    // Ottiene il tipo di utente (es. ADMIN, USER)
    const currentUserType = user?.props.role;

    // Controlla se l'utente è già loggato e ridireziona in base al tipo di utente
    if (state.url.startsWith('/login')) {
      switch (currentUserType) {
        case UserRole.ADMIN:
          await router.navigate(['/admin']);
          break;
        case UserRole.USER:
          await router.navigate(['/user']);
          break;
        default:
          break;
      }
    }

    // Controllo di accesso per la sezione /admin (solo per admin)
    if (state.url.startsWith('/admin') && currentUserType !== UserRole.ADMIN) {
      await router.navigate(['/unauthorized']);
      return false;
    }

    // Controllo di accesso per la sezione /user (solo per utenti normali)
    if (state.url.startsWith('/user') && currentUserType !== UserRole.USER) {
      await router.navigate(['/unauthorized']);
      return false;
    }

    // Accesso permesso
    return true;
  } catch {
    // In caso di errore o se l'utente non è loggato, ridireziona alla pagina di login
    await router.navigate(['/login']);
    return false;
  }
};
