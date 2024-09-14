/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { collection as getCollection, addDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment.development';
import { Doc } from '../model/firebase.model';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  /* Services */
  readonly logService = inject(LogService);

  /* Variables */
  private app = initializeApp(environment.firebaseConfig);
  private db: Firestore;
  private storage: FirebaseStorage;
  private auth: Auth;

  /* --------------------- Constructor --------------------- */
  constructor() {
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

  /* --------------------- Methods --------------------- */
  public async getAllDocuments<T>(collectionName: string): Promise<Doc<T>[]> {
    try {
      const collectionRef = getCollection(this.db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        props: doc.data() as T // Cast dei dati del documento a tipo T
      }));
    } catch (error) {
      this.logService.addLogError(error);
      throw error;
    }
  }

  public async addDocument<T extends Record<string, any>>(collectionName: string, data: T) {
    try {
      const collectionRef = getCollection(this.db, collectionName);
      const docRef = await addDoc(collectionRef, data);
      return docRef;
    } catch (error) {
      this.logService.addLogError(error);
      throw error;
    }
  }

  public async getDocumentByProp<T extends Record<string, any>>(
    collectionName: string,
    queryParam: { key: keyof T; value: any }
  ): Promise<Doc<T> | undefined> {
    try {
      const collectionRef = getCollection(this.db, collectionName);
      const q = query(collectionRef, where(queryParam.key as string, '==', queryParam.value));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        props: doc.data() as T
      }));
      return docs.length ? docs[0] : undefined;
    } catch (error) {
      this.logService.addLogError(error);
      throw error;
    }
  }
}
