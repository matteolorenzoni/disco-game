/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { FirebaseError, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { collection as getCollection, addDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment.development';
import { Doc } from '../model/firebase.model';
import { LogService } from './log.service';
import { LogType } from '../model/enum.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  /* Services */
  readonly logService = inject(LogService);

  /* Variables */
  private app = initializeApp(environment.firebaseConfig);
  private db = getFirestore(this.app);
  private storage = getStorage(this.app);
  private auth = getAuth(this.app);

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

      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        props: doc.data() as T // Cast dei dati del documento a tipo T
      }));

      return documents;
    } catch (error) {
      console.error('Error getting documents:', error); // TODO: toast
      throw error;
    }
  }

  public async addDocument<T extends Record<string, any>>(collection: string, data: T) {
    try {
      // TODO: loader
      const collectionRef = getCollection(this.db, collection);
      const docRef = await addDoc(collectionRef, data);
      // TODO: loader
      return docRef;
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        this.logService.addLogFirebase(LogType.ERROR, error.code);
      }
      throw error;
    }
  }

  public async getDocumentByProp<T extends Record<string, any>>(
    collection: string,
    queryParam: { key: keyof T; value: any }
  ): Promise<Doc<T> | undefined> {
    try {
      const collectionRef = getCollection(this.db, collection);
      const q = query(collectionRef, where(queryParam.key as string, '==', queryParam.value));
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        props: doc.data() as T
      }));
      return documents.length ? documents[0] : undefined;
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        this.logService.addLogFirebase(LogType.ERROR, error.code);
      }
      throw error;
    }
  }
}
