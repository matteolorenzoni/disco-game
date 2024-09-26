import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp
} from 'firebase/firestore';
import { ChallengePoint, User } from './user.model';
import { EventChallenge, Event } from './event.model';
import { Challenge, ChallengeStatus } from './challenge.model';
import { Team, TeamStatus } from './team.model';

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
      birthDate: dateToString(user.birthDate),
      imageUrl: user.imageUrl,
      role: user.role,
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
      birthDate: timestampToDate(data['birthDate'] as Timestamp),
      imageUrl: data['imageUrl'] || null,
      role: data['role'],
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
      location: event.location,
      imageUrl: event.imageUrl,
      //TODO: Capire cosa fare
      challenges: event.challenges.map((challenge) => ({
        challengeId: challenge.challengeId,
        startDate: dateToString(challenge.startDate),
        endDate: dateToString(challenge.endDate)
      })),
      isActive: event.isActive,
      startDate: dateToString(event.startDate),
      endDate: dateToString(event.endDate),
      createdAt: dateToString(event.createdAt),
      updatedAt: dateToString(event.updatedAt)
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Event {
    const data = snapshot.data(options)!;
    return {
      name: data['name'],
      description: data['description'],
      location: data['location'],
      imageUrl: data['imageUrl'] || null,
      //TODO: Capire cosa fare
      challenges: data['challenges'].map((challenge: EventChallenge) => ({
        challengeId: challenge.challengeId,
        startDate: challenge.startDate,
        endDate: challenge.endDate
      })),
      isActive: data['isActive'],
      startDate: timestampToDate(data['startDate'] as Timestamp),
      endDate: timestampToDate(data['endDate'] as Timestamp),
      createdAt: timestampToDate(data['createdAt'] as Timestamp),
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};

export const challengeConverter: FirestoreDataConverter<Challenge> = {
  toFirestore(challenge: Challenge): DocumentData {
    return {
      name: challenge.name,
      description: challenge.description,
      rules: challenge.rules,
      imageUrl: challenge.imageUrl,
      points: challenge.points,
      maxTimes: challenge.maxTimes,
      complexity: challenge.complexity,
      status: challenge.status,
      isActive: challenge.isActive,
      startDate: dateToString(challenge.startDate),
      endDate: dateToString(challenge.endDate),
      createdAt: dateToString(challenge.createdAt),
      updatedAt: dateToString(challenge.updatedAt)
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Challenge {
    const data = snapshot.data(options)!;
    return {
      name: data['name'],
      description: data['description'],
      rules: data['rules'],
      imageUrl: data['imageUrl'] || null,
      points: data['points'],
      maxTimes: data['maxTimes'],
      complexity: data['complexity'],
      status: data['status'] as ChallengeStatus,
      isActive: data['isActive'],
      startDate: timestampToDate(data['startDate'] as Timestamp),
      endDate: timestampToDate(data['endDate'] as Timestamp),
      createdAt: timestampToDate(data['createdAt'] as Timestamp),
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};

export const teamConverter: FirestoreDataConverter<Team> = {
  toFirestore(team: Team): DocumentData {
    return {
      userId: team.userId,
      eventId: team.eventId,
      name: team.name,
      description: team.description,
      code: team.code,
      status: team.status,
      memberIds: team.memberIds,
      isActive: team.isActive,
      createdAt: dateToString(team.createdAt),
      updatedAt: dateToString(team.updatedAt)
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Team {
    const data = snapshot.data(options)!;
    return {
      userId: data['userId'],
      eventId: data['eventId'],
      name: data['name'],
      description: data['description'],
      code: data['code'],
      status: data['status'] as TeamStatus,
      memberIds: data['memberIds'] || [],
      isActive: data['isActive'],
      createdAt: timestampToDate(data['createdAt'] as Timestamp),
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};
