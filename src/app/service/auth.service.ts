import { inject, Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/internal/operators/filter';
import { Observable } from 'rxjs/internal/Observable';
import { FirebaseService } from './firebase.service';
import { LogService } from './log.service';
import { User } from '../model/type.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  /* Variables */
  userFirebase = signal<FirebaseUser | null | undefined>(undefined);
  userFirebaseToken = signal<string | null | undefined>(undefined);
  user = signal<User | null | undefined>(undefined);

  public async logIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(this.firebaseService.getAuth(), email, password);
    } catch (error) {
      this.logService.addLogError(error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await signOut(this.firebaseService.getAuth());
    } catch (error) {
      this.logService.addLogError(error);
      throw error;
    }
  }

  public async signUp(email: string, password: string): Promise<UserCredential> {
    try {
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
        if (userFirebase) {
          const user = await this.firebaseService.getDocumentByProp<User>(environment.collection.USERS, {
            key: 'id',
            value: userFirebase.uid
          });
          if (!user) {
            throw new Error(
              'Registered user found but no associated document exists. Please contact support for assistance.'
            );
          }

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
