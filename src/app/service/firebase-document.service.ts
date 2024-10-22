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
  collection as getCollection,
  increment,
  orderBy,
  limit,
  QueryConstraint
} from 'firebase/firestore';
import { Doc } from '../model/firebase';
import { FirebaseService } from './firebase.service';
import { LogService } from './log.service';
import { KeysOfType } from '../model/type';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDocumentService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  /* --------------------- Methods READ --------------------- */
  public async getDocumentById<T extends Record<string, any> & { isActive: boolean }>(
    collectionName: string,
    id: string,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);
    const docRef = doc(collectionRef, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || !docSnap.data().isActive) throw new Error('noDocument', { cause: 'noDocument' });

    const data = docSnap.data() as T;
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

      // Controlla se 'isActive' esiste e, se sì, se è falso (se non esiste allora è 'vero')
      if (data.isActive === false) return acc;

      return [...acc, { id: docSnap.id, props: data }];
    }, [] as Doc<T>[]);

    return docs;
  }

  public async getDocumentsByProps<T extends Record<string, any>>(
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

  public async getDocumentsByPropsAndMostRecent<T extends Record<string, any>>(
    collectionName: string,
    queryParams: Partial<T>,
    datePropName: KeysOfType<T, Date>,
    limitCount: number,
    converter: FirestoreDataConverter<T>
  ): Promise<Doc<T>[]> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName).withConverter(converter);

    // Crea i vincoli della query basati sui parametri di filtro
    const queryConstraints: QueryConstraint[] = Object.entries(queryParams).map(([key, value]) =>
      where(key, '==', value)
    );

    // Aggiungi l'ordinamento e il limite
    queryConstraints.push(orderBy(datePropName as string, 'desc'));
    queryConstraints.push(limit(limitCount));

    // Esegui la query con i constraints
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    // Mappa i risultati
    const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, props: doc.data() as T }));
    return docs;
  }

  public async getDocumentsByRefs<T>(docRefString: string, converter: FirestoreDataConverter<T>): Promise<Doc<T>> {
    const docRef = doc(this.firebaseService.getDb(), docRefString).withConverter(converter);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('noDocument', { cause: 'noDocument' });

    const data = docSnap.data() as T;
    return { id: docSnap.id, props: data };
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
  public async updateDocument<T extends Record<string, any> & { updatedAt: Date }>(
    id: string,
    collectionName: string,
    data: Partial<T>
  ): Promise<void> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const docRef = doc(collectionRef, id);
    await updateDoc(docRef, { ...data, updatedAt: new Date() } as any);
  }

  // TODO: vedere se si riesce ad eliminare
  public async updateArrayPropReference<T extends Record<string, any> & { updatedAt: Date }>(
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

  public async incrementProp<T extends Record<string, any> & { updatedAt: Date }>(
    id: string,
    collectionName: string,
    prop: keyof T,
    value: number
  ): Promise<void> {
    const collectionRef = getCollection(this.firebaseService.getDb(), collectionName);
    const docRef = doc(collectionRef, id);
    await updateDoc(docRef, {
      [prop]: increment(value),
      updatedAt: new Date()
    });
  }
}
