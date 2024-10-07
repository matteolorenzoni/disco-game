import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp
} from 'firebase/firestore';
import { Challenge, ChallengeType } from './challenge.model';
import { Event } from './event.model';
import { Team, TeamStatus } from './team.model';
import { User, UserRole } from './user.model';
import { ChallengeStatus, EventChallenge } from './event-challenge.model';
import { UserEventTeam } from './user-event-team.model';

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
      imageUrl: user.imageUrl,
      role: user.role,
      userEventTeamRefs: user.userEventTeamRefs.map((ref) => ref.path),
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): User {
    const data = snapshot.data(options)!;
    return {
      name: data['name'],
      lastName: data['lastName'],
      userName: data['userName'],
      email: data['email'],
      imageUrl: data['imageUrl'] || null,
      role: data['role'] as UserRole,
      userEventTeamRefs: data['userEventTeamRefs'],
      isActive: data['isActive'],
      createdAt: data['createdAt'].toDate(),
      updatedAt: data['updatedAt'].toDate()
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
      startDate: dateToString(event.startDate),
      endDate: dateToString(event.endDate),
      userEventTeamRefs: event.userEventTeamRefs.map((ref) => ref.path),
      eventChallengeRefs: event.eventChallengeRefs.map((ref) => ref.path),
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
      location: data['location'],
      imageUrl: data['imageUrl'],
      startDate: timestampToDate(data['startDate'] as Timestamp),
      endDate: timestampToDate(data['endDate'] as Timestamp),
      userEventTeamRefs: data['userEventTeamRefs'],
      eventChallengeRefs: data['eventChallengeRefs'],
      isActive: data['isActive'],
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
      type: challenge.type,
      points: challenge.points,
      complexity: challenge.complexity,
      eventChallengeRefs: challenge.eventChallengeRefs.map((ref) => ref.path),
      isActive: challenge.isActive,
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
      type: data['type'],
      points: data['points'],
      complexity: data['complexity'],
      eventChallengeRefs: data['eventChallengeRefs'],
      isActive: data['isActive'],
      createdAt: timestampToDate(data['createdAt'] as Timestamp),
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};

export const teamConverter: FirestoreDataConverter<Team> = {
  toFirestore(team: Team): DocumentData {
    return {
      leaderId: team.leaderId,
      name: team.name,
      description: team.description,
      code: team.code,
      status: team.status,
      userEventTeamRefs: team.userEventTeamRefs.map((ref) => ref.path),
      isActive: team.isActive,
      createdAt: dateToString(team.createdAt),
      updatedAt: dateToString(team.updatedAt)
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): Team {
    const data = snapshot.data(options)!;
    return {
      leaderId: data['leaderId'],
      name: data['name'],
      description: data['description'],
      code: data['code'],
      status: data['status'] as TeamStatus,
      userEventTeamRefs: data['userEventTeamRefs'],
      isActive: data['isActive'],
      createdAt: timestampToDate(data['createdAt'] as Timestamp),
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};

export const userEventTeamConverter: FirestoreDataConverter<UserEventTeam> = {
  toFirestore(game: UserEventTeam): DocumentData {
    return {
      userId: game.userId,
      eventId: game.eventId,
      teamId: game.teamId,
      leaderId: game.leaderId,
      userName: game.userName,
      teamName: game.teamName,
      totalPoints: game.totalPoints,
      userEventTeamChallengeRefs: game.userEventTeamChallengeRefs.map((ref) => ref.path)
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): UserEventTeam {
    const data = snapshot.data(options)!;
    return {
      userId: data['userId'],
      eventId: data['eventId'],
      teamId: data['teamId'],
      leaderId: data['leaderId'],
      userName: data['userName'],
      teamName: data['teamName'],
      totalPoints: data['totalPoints'],
      userEventTeamChallengeRefs: data['userEventTeamChallengeRefs']
    };
  }
};

export const eventChallengeConverter: FirestoreDataConverter<EventChallenge> = {
  toFirestore(eventChallenge: EventChallenge): DocumentData {
    return {
      eventId: eventChallenge.eventId,
      challengeId: eventChallenge.challengeId,
      challengeName: eventChallenge.challengeName,
      challengeType: eventChallenge.challengeType,
      challengeStatus: eventChallenge.challengeStatus,
      maxTimes: eventChallenge.maxTimes,
      startDate: eventChallenge.startDate ? dateToString(eventChallenge.startDate) : null,
      endDate: eventChallenge.endDate ? dateToString(eventChallenge.endDate) : null
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): EventChallenge {
    const data = snapshot.data(options)!;
    return {
      eventId: data['eventId'],
      challengeId: data['challengeId'],
      challengeName: data['challengeName'],
      challengeType: data['challengeType'] as ChallengeType,
      challengeStatus: data['challengeStatus'] as ChallengeStatus,
      maxTimes: data['maxTimes'] !== null ? Number(data['maxTimes']) : null,
      startDate: data['startDate'] ? timestampToDate(data['startDate'] as Timestamp) : null,
      endDate: data['endDate'] ? timestampToDate(data['endDate'] as Timestamp) : null
    };
  }
};
