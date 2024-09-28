/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import {
  doc,
  FirestoreDataConverter,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  collection as getCollection,
  addDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { Doc } from '../model/firebase.model';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDocumentService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  /* --------------------- Methods READ --------------------- */
  public async getDocumentById<T>(
    collectionName: string,
    id: string,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>> {
    try {
      const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
      const docRef = doc(collectionRef, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as T;
        return { id: docSnap.id, props: data };
      } else {
        throw new Error('noDocument', { cause: 'noDocument' });
      }
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  public async getAllDocuments<T extends Record<string, any>>(
    collectionName: string,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>[]> {
    return await this.getDocumentsByProp(collectionName, {}, converter);
  }

  public async getDocumentsByProp<T extends Record<string, any>>(
    collectionName: string,
    queryParams: Partial<T>,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>[]> {
    try {
      const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
      const queryConstraints = Object.entries(queryParams).map(([key, value]) => where(key, '==', value));
      const isActiveConstraint = where('isActive', '==', true);
      const q = query(collectionRef, ...queryConstraints, isActiveConstraint);
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, props: doc.data() as T }));
      return docs;
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  /* --------------------- Methods CREATE --------------------- */
  public async addDocumentById<T extends Record<string, any>>(id: string, collectionName: string, data: T) {
    try {
      const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
      const docRef = doc(collectionRef, id);
      await setDoc(docRef, data);
      return docRef;
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  public async addDocument<T extends Record<string, any>>(collectionName: string, data: T) {
    try {
      const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
      const docRef = await addDoc(collectionRef, data);
      return docRef;
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  /* --------------------- Methods UPDATE --------------------- */
  public async updateDocument<T extends Record<string, any>>(
    id: string,
    collectionName: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
      const docRef = doc(collectionRef, id);
      await updateDoc(docRef, data as any);
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  public async updateArrayProp<T extends Record<string, any>>(
    operation: 'add' | 'remove',
    id: string,
    collectionName: string,
    propToUpdate: keyof T,
    valueToUpdate: T[keyof T]
  ): Promise<void> {
    try {
      const teamRef = doc(this.firebaseService.getDb(), `${collectionName}/${id}`);
      await updateDoc(teamRef, {
        [propToUpdate]: operation === 'add' ? arrayUnion(valueToUpdate) : arrayRemove(valueToUpdate),
        updatedAt: new Date()
      });
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }
}
