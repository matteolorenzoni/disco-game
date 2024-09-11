import { inject, Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';
import { LogService } from './log.service';
import { FirebaseError } from 'firebase/app';
import { LogType } from '../model/enum.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  /* Variables */
  user = signal<User | undefined>(undefined);
  userToken = signal<string | undefined>(undefined);

  public async logIn(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.firebaseService.getAuth(), email, password);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        this.logService.addLogFirebase(LogType.ERROR, error.code);
      }
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await signOut(this.firebaseService.getAuth());
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        this.logService.addLogFirebase(LogType.ERROR, error.code);
      }
      throw error;
    }
  }

  public async signUp(email: string, password: string): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(this.firebaseService.getAuth(), email, password);
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        this.logService.addLogFirebase(LogType.ERROR, error.code);
      }
      throw error;
    }
  }

  public observeUserState(): void {
    try {
      onAuthStateChanged(this.firebaseService.getAuth(), (user) => {
        if (user) this.setUserInfo(user);
        else this.setUserInfo(undefined);
      });
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        this.logService.addLogFirebase(LogType.ERROR, error.code);
      }
      throw error;
    }
  }

  /* ---------------- Utils  ---------------- */
  private async setUserInfo(user: User | undefined) {
    // User
    this.user.set(user);

    // User token
    const userToken = await user?.getIdToken();
    this.userToken.set(userToken);
  }
}
