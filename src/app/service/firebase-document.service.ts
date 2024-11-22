/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import {
  addDoc,
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
  collection as getCollection,
  QueryConstraint,
  onSnapshot,
  deleteDoc,
  arrayRemove,
  getCountFromServer
} from 'firebase/firestore';
import { Doc } from '../model/firebase';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDocumentService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);

  /* --------------------- Methods READ --------------------- */
  public async getDocumentById<T extends Record<string, any> & { isActive: boolean }>(
    collectionName: string,
    id: string,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    const docRef = doc(collectionRef, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('noDocument', { cause: 'noDocument' });

    const data = docSnap.data() as T;
    if (!data.isActive) throw new Error('documentNotActive', { cause: 'documentNotActive' });

    return { id: docSnap.id, props: data };
  }

  public async getDocumentsByIds<T extends Record<string, any> & { isActive?: boolean }>(
    collectionName: string,
    ids: string[],
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>[]> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    const docRefs = ids.map((id) => doc(collectionRef, id));
    const docsSnap = await Promise.all(docRefs.map((ref) => getDoc(ref)));

    const docs: Doc<T>[] = docsSnap.reduce((acc, docSnap) => {
      if (!docSnap.exists()) return acc;

      const data = docSnap.data() as T;
      if (data.isActive === false) return acc;

      return [...acc, { id: docSnap.id, props: data }];
    }, [] as Doc<T>[]);

    return docs;
  }

  public async getDocumentsWithConstraints<T extends Record<string, any>>(
    collectionName: string,
    queryConstraints: QueryConstraint[],
    converter: FirestoreDataConverter<T>,
    isActiveConstraint = true
  ): Promise<Doc<T>[]> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    if (isActiveConstraint) queryConstraints.push(where('isActive', '==', true));
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, props: doc.data() as T }));
    return docs;
  }

  public async getDocumentCountWithConstraints<T extends Record<string, any>>(
    collectionName: string,
    queryConstraints: QueryConstraint[],
    converter: FirestoreDataConverter<T>,
    isActiveConstraint = true
  ): Promise<number> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    if (isActiveConstraint) queryConstraints.push(where('isActive', '==', true));
    const q = query(collectionRef, ...queryConstraints);
    const countSnapshot = await getCountFromServer(q);
    return countSnapshot.data().count;
  }

  public async getDocumentWithConstraints<T extends Record<string, any>>(
    collectionName: string,
    queryConstraints: QueryConstraint[],
    converter: FirestoreDataConverter<T>,
    isActiveConstraint = true
  ): Promise<Doc<T> | null> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    if (isActiveConstraint) queryConstraints.push(where('isActive', '==', true));
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    if (querySnapshot.size > 1) throw new Error('tooManyDocuments', { cause: 'tooManyDocuments' });
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, props: doc.data() as T };
  }

  /* --------------------- Methods READ subscribe --------------------- */
  public subscribeToDocumentsWithConstraints<T extends Record<string, any>>(
    collectionName: string,
    queryConstraints: QueryConstraint[],
    converter: FirestoreDataConverter<T>,
    onUpdate: (documents: Doc<T>[]) => void,
    isActiveConstraint = true
  ): () => void {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    if (isActiveConstraint) queryConstraints.push(where('isActive', '==', true));
    const q = query(collectionRef, ...queryConstraints);

    return onSnapshot(q, (querySnapshot) => {
      const documents: Doc<T>[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        props: doc.data() as T
      }));
      onUpdate(documents);
    });
  }

  public subscribeToDocumentWithConstraints<T extends Record<string, any>>(
    collectionName: string,
    queryConstraints: QueryConstraint[],
    converter: FirestoreDataConverter<T>,
    onUpdate: (documents: Doc<T> | null) => void,
    isActiveConstraint = true
  ): () => void {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    if (isActiveConstraint) queryConstraints.push(where('isActive', '==', true));
    const q = query(collectionRef, ...queryConstraints);

    return onSnapshot(q, (querySnapshot) => {
      const documents: Doc<T>[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        props: doc.data() as T
      }));
      if (documents.length > 1) throw new Error('tooManyDocuments', { cause: 'tooManyDocuments' });
      const document = documents[0] as Doc<T> | undefined;
      onUpdate(document ?? null);
    });
  }

  /* --------------------- Methods CREATE --------------------- */
  public createDocId(collectionName: string): string {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const newDocRef = doc(collectionRef);
    return newDocRef.id;
  }

  public async addDocumentById<T extends Record<string, any> & { updatedAt: Date }>(
    id: string,
    collectionName: string,
    data: T
  ): Promise<DocumentReference<DocumentData, DocumentData>> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const docRef = doc(collectionRef, id);
    await setDoc(docRef, data);
    return docRef;
  }

  public async addDocument<T extends Record<string, any> & { updatedAt: Date }>(
    collectionName: string,
    data: T
  ): Promise<DocumentReference<DocumentData, DocumentData>> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const docRef = await addDoc(collectionRef, data);
    return docRef;
  }

  /* --------------------- Methods UPDATE --------------------- */
  public async updateDocuments<T extends Record<string, any> & { updatedAt: Date }>(
    ids: string[],
    collectionName: string,
    data: Partial<T>
  ): Promise<void> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const updates = ids.map(async (id) => {
      const docRef = doc(collectionRef, id);
      return updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    });

    await Promise.all(updates);
  }

  public async updateDocumentArray<T extends Record<string, any> & { updatedAt: Date }, K>(
    operation: 'ADD' | 'REMOVE',
    id: string,
    collectionName: string,
    arrayField: keyof T,
    newValue: K
  ): Promise<void> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const docRef = doc(collectionRef, id);
    await updateDoc(docRef, {
      [arrayField]: operation === 'ADD' ? arrayUnion(newValue) : arrayRemove(newValue),
      updatedAt: new Date()
    });
  }

  /* --------------------- Methods UPDATE --------------------- */
  public async deleteDocuments(ids: string[], collectionName: string): Promise<void> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);

    // Creazione di un array di promesse per ogni eliminazione
    const deletePromises = ids.map((id) => {
      const docRef = doc(collectionRef, id);
      return deleteDoc(docRef);
    });

    // Attendi il completamento di tutte le eliminazioni
    await Promise.all(deletePromises);
  }
}
