import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { filter } from 'rxjs/internal/operators/filter';
import { Observable } from 'rxjs/internal/Observable';
import { FirebaseService } from './firebase.service';
import { LogService } from './log.service';
import { User } from '../model/user.model';
import { LoginModel, SignUpModel } from '../model/form.model';
import { FirebaseUserService } from './firebase-user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly firebaseUserService = inject(FirebaseUserService);
  readonly logService = inject(LogService);

  /* Variables */
  userFirebase = signal<FirebaseUser | null | undefined>(undefined);
  userFirebaseToken = signal<string | null | undefined>(undefined);
  user = signal<User | null | undefined>(undefined);

  public async logIn(form: LoginModel): Promise<UserCredential> {
    try {
      const { email, password } = form;
      return await signInWithEmailAndPassword(this.firebaseService.getAuth(), email, password);
    } catch (error) {
      this.logService.addLogError(error);
      throw error;
    }
  }

  public async logout(redirect = true): Promise<void> {
    try {
      await signOut(this.firebaseService.getAuth());
      if (redirect) await this.router.navigate(['/login']);
    } catch (error) {
      this.logService.addLogError(error);
      throw error;
    }
  }

  public async signUp(form: SignUpModel): Promise<UserCredential> {
    try {
      const { email, password } = form;
      return await createUserWithEmailAndPassword(this.firebaseService.getAuth(), email, password);
    } catch (error) {
      this.logService.addLogError(error);
      throw error;
    }
  }

  public observeUserState(): void {
    onAuthStateChanged(this.firebaseService.getAuth(), async (userFirebase) => {
      console.log(`User UID: ${userFirebase?.uid}`); // TODO: eliminare

      // User firebase
      this.userFirebase.set(userFirebase);

      // User firebase token
      const userToken = await userFirebase?.getIdToken();
      this.userFirebaseToken.set(userToken);

      try {
        // User
        if (userFirebase && window.location.pathname !== '/sign-up') {
          const user = await this.firebaseUserService.getUserById(userFirebase.uid);
          this.user.set(user.props);
        } else {
          this.user.set(null);
        }
      } catch (error) {
        this.logService.addLogError(error);
        throw error;
      }
    });
  }

  /* ---------------- Utils  ---------------- */
  public userAsObservable(): Observable<User | null> {
    return toObservable(this.user).pipe(filter((user) => user !== undefined));
  }
}
