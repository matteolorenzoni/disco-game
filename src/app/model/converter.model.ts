import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp
} from 'firebase/firestore';
import { Challenge, Event } from './event.model';

/* ---------------------- Utils ---------------------- */
// Funzione per convertire stringa ISO in oggetto Date
const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

// Funzione per convertire oggetto Date in stringa ISO
const dateToString = (date: Date): string => {
  return date.toISOString();
};

/* ---------------------- Converter ---------------------- */
export const eventConverter: FirestoreDataConverter<Event> = {
  toFirestore(event: Event): DocumentData {
    return {
      name: event.name,
      description: event.description,
      startDate: dateToString(event.startDate),
      endDate: dateToString(event.endDate),
      location: event.location,
      imageUrl: event.imageUrl,
      challenges: event.challenges.map((challenge) => ({
        //TODO: Capire cosa fare
        challengeId: challenge.challengeId,
        startDate: dateToString(challenge.startDate),
        endDate: dateToString(challenge.endDate),
        status: challenge.status
      })),
      isActive: event.isActive,
      createdAt: dateToString(event.createdAt),
      updatedAt: dateToString(event.updatedAt)
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Event {
    const data = snapshot.data(options)!;
    return {
      name: data['name'],
      description: data['description'],
      startDate: timestampToDate(data['startDate'] as Timestamp),
      endDate: timestampToDate(data['endDate'] as Timestamp),
      location: data['location'],
      imageUrl: data['imageUrl'] || null,
      challenges: data['challenges'].map((challenge: Challenge) => ({
        //TODO: Capire cosa fare
        challengeId: challenge.challengeId,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        status: challenge.status
      })),
      isActive: data['isActive'],
      createdAt: timestampToDate(data['createdAt'] as Timestamp),
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};
