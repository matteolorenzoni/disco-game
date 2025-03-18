import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp
} from 'firebase/firestore';
import { Challenge, ChallengeType } from './challenge.model';
import { ChallengeStatus, EventChallenge } from './event-challenge.model';
import { Event } from './event.model';
import { Team } from './team.model';
import { User, UserRole } from './user.model';

type ConvertDatesToTimestamp<T> = {
  [K in keyof T]: T[K] extends Date
    ? Timestamp // Se è solo Date
    : T[K] extends Date | null
      ? Timestamp | null // Se è Date | null
      : T[K] extends Date | undefined
        ? Timestamp | undefined // Se è Date | undefined
        : T[K] extends Date | null | undefined
          ? Timestamp | null | undefined // Gestisci Date | null | undefined
          : T[K] extends object // Se è Date | null | undefined
            ? ConvertDatesToTimestamp<T[K]> // Applica ricorsivamente
            : T[K]; // Altrimenti lascia invariato
};

/* ---------------------- Utils ---------------------- */
// Funzione per convertire stringa ISO in oggetto Date
const timestampToDate = (timestamp: Timestamp | string): Date => {
  return typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate();
};

/* ---------------------- Converter ---------------------- */
export const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return user;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): User {
    const data = snapshot.data(options)! as ConvertDatesToTimestamp<User>;
    return {
      name: data['name'],
      lastName: data['lastName'],
      userName: data['userName'],
      email: data['email'],
      registeredAt: data['registeredAt'] ? timestampToDate(data['registeredAt']) : null,
      birthDate: timestampToDate(data['birthDate']),
      imageUrl: data['imageUrl'],
      role: data['role'] as UserRole,
      code: data['code'],
      participations: data['participations'],
      isActive: data['isActive'],
      updatedAt: timestampToDate(data['updatedAt'])
    };
  }
};

export const eventConverter: FirestoreDataConverter<Event> = {
  toFirestore(event: Event): DocumentData {
    return event;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Event {
    const data = snapshot.data(options)! as ConvertDatesToTimestamp<Event>;
    return {
      name: data['name'],
      description: data['description'],
      code: data['code'],
      location: data['location'],
      imageUrl: data['imageUrl'],
      startDate: timestampToDate(data['startDate']),
      endDate: timestampToDate(data['endDate']),
      teamIds: data['teamIds'],
      isActive: data['isActive'],
      updatedAt: timestampToDate(data['updatedAt'])
    };
  }
};

export const teamConverter: FirestoreDataConverter<Team> = {
  toFirestore(team: Team): DocumentData {
    return team;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Team {
    const data = snapshot.data(options)! as ConvertDatesToTimestamp<Team>;
    return {
      name: data['name'],
      code: data['code'],
      leaderId: data['leaderId'],
      status: data['status'],
      bonusPoints: data['bonusPoints'],
      totalPoints: data['totalPoints'],
      eventId: data['eventId'],
      eventStartDate: timestampToDate(data['eventStartDate']),
      userIds: data['userIds'],
      users: data['users'].map((user) => ({
        id: user.id,
        userName: user.userName,
        imageUrl: user.imageUrl,
        registeredAt: user.registeredAt ? timestampToDate(user.registeredAt) : null,
        challenges: user.challenges.map((challenge) => ({
          id: challenge.id,
          timestamps: challenge.timestamps.map((x) => timestampToDate(x)),
          totalPoints: challenge.totalPoints
        }))
      })),
      isActive: data['isActive'],
      updatedAt: timestampToDate(data['updatedAt'])
    };
  }
};

export const challengeConverter: FirestoreDataConverter<Challenge> = {
  toFirestore(challenge: Challenge): DocumentData {
    return challenge;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Challenge {
    const data = snapshot.data(options)! as ConvertDatesToTimestamp<Challenge>;
    return {
      name: data['name'],
      description: data['description'],
      rules: data['rules'],
      type: data['type'],
      points: data['points'],
      complexity: data['complexity'],
      isActive: data['isActive'],
      updatedAt: timestampToDate(data['updatedAt'])
    };
  }
};

export const eventChallengeConverter: FirestoreDataConverter<EventChallenge> = {
  toFirestore(eventChallenge: EventChallenge): DocumentData {
    return eventChallenge;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): EventChallenge {
    const data = snapshot.data(options)! as ConvertDatesToTimestamp<EventChallenge>;
    return {
      eventId: data['eventId'],
      eventStartDate: timestampToDate(data['eventStartDate']),
      challengeId: data['challengeId'],
      challengeName: data['challengeName'],
      challengeType: data['challengeType'] as ChallengeType,
      status: data['status'] as ChallengeStatus,
      maxTimes: data['maxTimes'],
      startDate: data['startDate'] ? timestampToDate(data['startDate']) : null,
      endDate: data['endDate'] ? timestampToDate(data['endDate']) : null,
      updatedAt: timestampToDate(data['updatedAt'])
    };
  }
};
