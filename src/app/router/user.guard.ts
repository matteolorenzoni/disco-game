import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/internal/operators/filter';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { User as FirebaseUser } from 'firebase/auth';
import { UserService } from '../service/user.service';
import { FirebaseService } from '../service/firebase.service';
import { UserType } from '../model/user.model';

export const userGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const firebaseService = inject(FirebaseService);
  const userService = inject(UserService);

  try {
    // Recupera l'utente Firebase, filtrando i valori undefined
    const userFirebase = await firstValueFrom(
      toObservable(firebaseService.userFirebase).pipe(filter((user): user is FirebaseUser => user !== undefined))
    );

    // Recupera l'utente dalla tua applicazione
    let user = await firstValueFrom(toObservable(userService.user).pipe(filter((user) => user !== undefined)));

    // Se non esiste l'utente dell'app ma esiste quello Firebase, carica i suoi dati
    if (!user && userFirebase) {
      const fetchedUser = await userService.getUserById(userFirebase.uid);
      user = fetchedUser.props;
    }

    // Se non ci sono utenti, reindirizza al login
    if (!user) {
      await router.navigate(['/login']);
      return false;
    }

    // Verifica il tipo di utente per reindirizzamenti
    const currentUserType = user?.type;

    // Gestisci la navigazione basata sul tipo di utente
    if (state.url.startsWith('/login')) {
      if (currentUserType === UserType.ADMIN) {
        await router.navigate(['/admin']);
      } else if (currentUserType === UserType.USER) {
        await router.navigate(['/user']);
      }
      return false; // Impedisce l'accesso alla pagina di login se già autenticato
    }

    // Blocca l'accesso non autorizzato ad aree specifiche
    if (state.url.startsWith('/admin') && currentUserType !== UserType.ADMIN) {
      await router.navigate(['/unauthorized']);
      return false;
    }

    if (state.url.startsWith('/user') && currentUserType !== UserType.USER) {
      await router.navigate(['/unauthorized']);
      return false;
    }

    // Se tutte le condizioni sono soddisfatte, consenti l'accesso
    return true;
  } catch {
    // Se si verifica un errore, reindirizza al login
    await router.navigate(['/login']);
    return false;
  }
};
