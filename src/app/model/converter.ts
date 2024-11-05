import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp
} from 'firebase/firestore';
import { Challenge, ChallengeType } from './challenge.model';
import { Event } from './event.model';
import { Team, TeamUser } from './team.model';
import { User, UserRole } from './user.model';
import { ChallengeStatus, EventChallenge } from './event-challenge.model';

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
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      birthDate: user.birthDate,
      imageUrl: user.imageUrl,
      role: user.role,
      code: user.code,
      participations: user.participations,
      isActive: user.isActive,
      updatedAt: user.updatedAt
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): User {
    const data = snapshot.data(options)!;
    return {
      name: data['name'],
      lastName: data['lastName'],
      userName: data['userName'],
      birthDate: timestampToDate(data['birthDate'] as Timestamp),
      email: data['email'],
      imageUrl: data['imageUrl'] || null,
      role: data['role'] as UserRole,
      code: data['code'],
      participations: data['participations'],
      isActive: data['isActive'],
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};

export const eventConverter: FirestoreDataConverter<Event> = {
  toFirestore(event: Event): DocumentData {
    return {
      name: event.name,
      description: event.description,
      code: event.code,
      location: event.location,
      imageUrl: event.imageUrl,
      startDate: event.startDate,
      endDate: event.endDate,
      teamIds: event.teamIds,
      isActive: event.isActive,
      updatedAt: event.updatedAt
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Event {
    const data = snapshot.data(options)!;
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
    return {
      name: team.name,
      code: team.code,
      leaderId: team.leaderId,
      status: team.status,
      totalPoints: team.totalPoints,
      eventId: team.eventId,
      eventStartDate: team.eventStartDate,
      userIds: team.userIds,
      users: team.users.map((user) => ({
        id: user.id,
        userName: user.userName,
        imageUrl: user.imageUrl,
        challenges: user.challenges
      })),
      isActive: team.isActive,
      updatedAt: team.updatedAt
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Team {
    const data = snapshot.data(options)!;
    return {
      name: data['name'],
      code: data['code'],
      leaderId: data['leaderId'],
      status: data['status'],
      totalPoints: data['totalPoints'],
      eventId: data['eventId'],
      eventStartDate: timestampToDate(data['eventStartDate']),
      userIds: data['userIds'],
      users: data['users'].map((user: TeamUser) => ({
        id: user.id,
        userName: user.userName,
        imageUrl: user.imageUrl,
        challenges: user.challenges.map((challenge) => ({
          id: challenge.id,
          timestamps: challenge.timestamps.map((timestamp) => timestampToDate(timestamp as unknown as Timestamp)),
          totalPoints: challenge.totalPoints
        }))
      })),
      isActive: data['isActive'],
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
      type: challenge.type,
      points: challenge.points,
      complexity: challenge.complexity,
      isActive: challenge.isActive,
      updatedAt: dateToString(challenge.updatedAt)
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Challenge {
    const data = snapshot.data(options)!;
    return {
      name: data['name'],
      description: data['description'],
      rules: data['rules'],
      type: data['type'],
      points: data['points'],
      complexity: data['complexity'],
      isActive: data['isActive'],
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};

export const eventChallengeConverter: FirestoreDataConverter<EventChallenge> = {
  toFirestore(eventChallenge: EventChallenge): DocumentData {
    return {
      eventId: eventChallenge.eventId,
      eventStartDate: eventChallenge.eventStartDate,
      challengeId: eventChallenge.challengeId,
      challengeName: eventChallenge.challengeName,
      challengeType: eventChallenge.challengeType,
      status: eventChallenge.status,
      maxTimes: eventChallenge.maxTimes,
      startDate: eventChallenge.startDate ? dateToString(eventChallenge.startDate) : null,
      endDate: eventChallenge.endDate ? dateToString(eventChallenge.endDate) : null,
      updatedAt: eventChallenge.updatedAt
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): EventChallenge {
    const data = snapshot.data(options)!;
    return {
      eventId: data['eventId'],
      eventStartDate: timestampToDate(data['eventStartDate']),
      challengeId: data['challengeId'],
      challengeName: data['challengeName'],
      challengeType: data['challengeType'] as ChallengeType,
      status: data['status'] as ChallengeStatus,
      maxTimes: data['maxTimes'] !== null ? Number(data['maxTimes']) : null,
      startDate: data['startDate'] ? timestampToDate(data['startDate'] as Timestamp) : null,
      endDate: data['endDate'] ? timestampToDate(data['endDate'] as Timestamp) : null,
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};
