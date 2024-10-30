import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  UserCredential,
  Auth,
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';
import { LoginModel } from '../model/form.model';
import { LocalStorageService } from './local-storage.service';
import { IndexedDbService } from './indexed-db.service';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  /* Variables */
  readonly router = inject(Router);
  readonly httpService = inject(HttpService);
  readonly lsService = inject(LocalStorageService);
  readonly dbService = inject(IndexedDbService);

  /* Variables */
  private app: FirebaseApp;
  private db: Firestore;
  private storage: FirebaseStorage;
  private auth: Auth;

  /* Variables */
  userFirebase = signal<FirebaseUser | null | undefined>(undefined);
  userFirebaseToken = signal<string | null | undefined>(undefined);

  /* --------------------- Constructor --------------------- */
  constructor() {
    this.app = initializeApp(environment.firebaseConfig);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    this.auth = getAuth(this.app);
  }

  /* --------------------- Getters --------------------- */
  public getDb(): Firestore {
    return this.db;
  }

  public getStorage(): FirebaseStorage {
    return this.storage;
  }

  public getAuth(): Auth {
    return this.auth;
  }

  /* --------------------------- Auth ---------------------------*/
  public async logIn(form: LoginModel, rememberMe: boolean): Promise<UserCredential> {
    return await this.httpService.execute(async () => {
      const { email, password } = form;
      await setPersistence(this.auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      return await signInWithEmailAndPassword(this.auth, email, password);
    });
  }

  public async logout(): Promise<void> {
    return await this.httpService.execute(async () => {
      await signOut(this.auth);
      this.lsService.clearAll();
      await this.dbService.clearAll();
    });
  }

  public async signUp(email: string, password: string): Promise<UserCredential> {
    return await this.httpService.execute(async () => {
      return await createUserWithEmailAndPassword(this.auth, email, password);
    });
  }

  public observeUserState() {
    onAuthStateChanged(this.auth, async (userFirebase) => {
      console.log(`User UID: ${userFirebase?.uid}`); // TODO: eliminare

      // User firebase
      this.userFirebase.set(userFirebase);

      // User firebase token
      const userToken = await userFirebase?.getIdToken();
      this.userFirebaseToken.set(userToken);
    });
  }
}
