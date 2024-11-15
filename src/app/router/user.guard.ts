import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/internal/operators/filter';
import { FirebaseService } from '../service/firebase.service';
import { UserRole } from '../model/user.model';
import { LocalStorageService } from '../service/local-storage.service';

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
    const lsUser = lsService.getUser();

    // Ottiene il tipo di utente (ADMIN, SCANNER o USER)
    const currentUserType = lsUser?.props.role;

    // Controllo: Se l'utente è su /login ed è già autenticato, ridirigi in base al ruolo
    if (state.url.startsWith('/login')) {
      if (!userFirebase) {
        lsService.removeUser();
        return true;
      }

      switch (currentUserType) {
        case UserRole.ADMIN:
          await router.navigateByUrl('/admin');
          break;
        case UserRole.SCANNER:
          await router.navigateByUrl('/scanner');
          break;
        case UserRole.USER:
          await router.navigateByUrl('/user');
          break;
        default:
          break;
      }
    }

    // Controllo: Se l'utente non è autenticato e non è su /sign-up, ridirigi a /login
    if (!userFirebase && !state.url.startsWith('/sign-up')) {
      await router.navigateByUrl('/login');
      return false;
    }

    // Controllo: Se l'utente tenta l'accesso per la sezione /admin (solo per admin)
    if (state.url.startsWith('/admin') && currentUserType !== UserRole.ADMIN) {
      await router.navigateByUrl('/unauthorized');
      return false;
    }

    // Controllo: Se l'utente tenta l'accesso per la sezione /scanner (solo per chi deve scannerizzare qrcode)
    if (state.url.startsWith('/scanner') && currentUserType !== UserRole.SCANNER) {
      await router.navigateByUrl('/unauthorized');
      return false;
    }

    // Controllo: Se l'utente tenta l'accesso per la sezione /user (solo per utenti normali)
    if (state.url.startsWith('/user') && currentUserType !== UserRole.USER) {
      await router.navigateByUrl('/unauthorized');
      return false;
    }

    // Accesso: permesso accordato
    return true;
  } catch {
    // In caso di errore o se l'utente non è loggato, ridireziona alla pagina di login
    await router.navigateByUrl('/login');
    return false;
  }
};
