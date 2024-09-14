import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp
} from 'firebase/firestore';
import { ChallengePoint, User } from './user.model';
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
export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return {
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      email: user.email,
      defaultCode: user.defaultCode,
      type: user.type,
      birthDate: dateToString(user.birthDate),
      //TODO: Capire cosa fare
      challengePoints: user.challengePoints.map((point) => ({
        challengeId: point.challengeId,
        eventId: point.eventId,
        completionDate: dateToString(point.completionDate)
      })),
      isActive: user.isActive,
      createdAt: dateToString(user.createdAt),
      updatedAt: dateToString(user.updatedAt)
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): User {
    const data = snapshot.data(options)!;
    return {
      name: data['name'],
      lastname: data['lastname'],
      username: data['username'],
      email: data['email'],
      defaultCode: data['defaultCode'],
      type: data['type'],
      birthDate: timestampToDate(data['birthDate'] as Timestamp),
      //TODO: Capire cosa fare
      challengePoints: data['challengePoints'].map((point: ChallengePoint) => ({
        challengeId: point.challengeId,
        eventId: point.eventId,
        completionDate: point.completionDate
      })),
      isActive: data['isActive'],
      createdAt: timestampToDate(data['createdAt'] as Timestamp),
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};

export const eventConverter: FirestoreDataConverter<Event> = {
  toFirestore(event: Event): DocumentData {
    return {
      name: event.name,
      description: event.description,
      startDate: dateToString(event.startDate),
      endDate: dateToString(event.endDate),
      location: event.location,
      imageUrl: event.imageUrl,
      //TODO: Capire cosa fare
      challenges: event.challenges.map((challenge) => ({
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
      //TODO: Capire cosa fare
      challenges: data['challenges'].map((challenge: Challenge) => ({
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
