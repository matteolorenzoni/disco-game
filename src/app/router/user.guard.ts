import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/internal/operators/filter';
import { FirebaseService } from '../service/firebase.service';
import { User, UserRole } from '../model/user.model';
import { LocalStorageService } from '../service/local-storage.service';
import { Doc } from '../model/firebase';

const KEY_USER = 'USER';

export const userGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const firebaseService = inject(FirebaseService);
  const lsService = inject(LocalStorageService);

  try {
    // Usa l'Observable di userFirebase e filtra i valori undefined
    const userFirebase = await firstValueFrom(
      toObservable(firebaseService.userFirebase).pipe(filter((user) => user !== undefined))
    );

    // Recupero le informazioni dell'utente dal local storage
    // Se viene modificato diventa undefined quindi va in 'unauthorized
    const user = lsService.getItem<Doc<User>>(KEY_USER);

    // Ottiene il tipo di utente (ADMIN, SCANNER o USER)
    const currentUserType = user?.props.role;

    // Controlla se l'utente è già loggato e ridireziona in base al tipo di utente
    if (state.url.startsWith('/login')) {
      if (!userFirebase) {
        lsService.removeItem(KEY_USER);
        return true;
      }

      switch (currentUserType) {
        case UserRole.ADMIN:
          await router.navigate(['/admin']);
          break;
        case UserRole.SCANNER:
          await router.navigate(['/scanner']);
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

    // Controllo di accesso per la sezione /scanner (solo per chi deve scannerizzare qrcode)
    if (state.url.startsWith('/scanner') && currentUserType !== UserRole.SCANNER) {
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
