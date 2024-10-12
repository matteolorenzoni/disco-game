/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  doc,
  DocumentData,
  DocumentReference,
  FirestoreDataConverter,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  collection as getCollection
} from 'firebase/firestore';
import { Doc } from '../model/firebase';
import { FirebaseService } from './firebase.service';
import { LogService } from './log.service';

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
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    const docRef = doc(collectionRef, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('noDocument', { cause: 'noDocument' });

    const data = docSnap.data() as T;
    return { id: docSnap.id, props: data };
  }

  public async getAllDocuments<T extends Record<string, any>>(
    collectionName: string,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>[]> {
    return await this.getDocumentsByProp(collectionName, {}, converter);
  }

  public async getAllActiveDocuments<T extends Record<string, any> & { isActive: boolean }>(
    collectionName: string,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>[]> {
    return await this.getActiveDocumentsByProp(collectionName, {}, converter);
  }

  public async getDocumentsByProp<T extends Record<string, any>>(
    collectionName: string,
    queryParams: Partial<T>,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>[]> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    const queryConstraints = Object.entries(queryParams).map(([key, value]) => where(key, '==', value));
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, props: doc.data() as T }));
    return docs;
  }

  public async getActiveDocumentsByProp<T extends Record<string, any> & { isActive: boolean }>(
    collectionName: string,
    queryParams: Partial<T>,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>[]> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    const queryConstraints = Object.entries(queryParams).map(([key, value]) => where(key, '==', value));
    const isActiveConstraint = where('isActive', '==', true);
    const q = query(collectionRef, ...queryConstraints, isActiveConstraint);
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, props: doc.data() as T }));
    return docs;
  }

  /* --------------------- Methods CREATE --------------------- */
  public createDocId(collectionName: string): string {
    // Ottieni un riferimento alla collezione
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);

    // Genera un nuovo riferimento al documento
    const newDocRef = doc(collectionRef);

    // Restituisci l'ID generato
    return newDocRef.id;
  }

  public async addDocumentById<T extends Record<string, any>>(
    id: string,
    collectionName: string,
    data: T
  ): Promise<DocumentReference<DocumentData, DocumentData>> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const docRef = doc(collectionRef, id);
    await setDoc(docRef, data);
    return docRef;
  }

  public async addDocument<T extends Record<string, any>>(
    collectionName: string,
    data: T
  ): Promise<DocumentReference<DocumentData, DocumentData>> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const docRef = await addDoc(collectionRef, data);
    return docRef;
  }

  /* --------------------- Methods UPDATE --------------------- */
  public async updateDocument<T extends Record<string, any>>(
    id: string,
    collectionName: string,
    data: Partial<T>
  ): Promise<void> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const docRef = doc(collectionRef, id);
    await updateDoc(docRef, data as any);
  }

  public async updateArrayPropReference<T extends Record<string, any>>(
    operation: 'add' | 'remove',
    propToUpdate: keyof T,
    docId: string,
    referenceId: string
  ): Promise<void> {
    const docRef = doc(this.firebaseService.getDb(), docId);
    const referencesRef = doc(this.firebaseService.getDb(), referenceId);
    await updateDoc(docRef, {
      [propToUpdate]: operation === 'add' ? arrayUnion(referencesRef) : arrayRemove(referencesRef),
      updatedAt: new Date()
    });
  }
}
