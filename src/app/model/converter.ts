import {
  doc,
  DocumentData,
  DocumentReference,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp
} from 'firebase/firestore';
import { Challenge, ChallengeStatus } from './challenge.model';
import { Event, EventChallenge } from './event.model';
import { Team, TeamStatus } from './team.model';
import { User, UserRole } from './user.model';
import { UserChallenge } from './user-challenge.model';
import { UserGame } from './user-game.model';

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
      birthDate: user.birthDate, // Considera di usare una funzione per convertire Date in Timestamp se necessario
      imageUrl: user.imageUrl,
      role: user.role,
      games: user.games.map((gameRef) => gameRef.path), // Salviamo il percorso dei riferimenti ai giochi
      isActive: user.isActive,
      createdAt: user.createdAt, // Considera di convertire anche questo in Timestamp
      updatedAt: user.updatedAt // Converti in Timestamp se necessario
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): User {
    const data = snapshot.data(options)!;
    return {
      name: data['name'],
      lastname: data['lastname'],
      username: data['username'],
      email: data['email'],
      birthDate: data['birthDate'].toDate(), // Converti da Timestamp a Date
      imageUrl: data['imageUrl'] || null,
      role: data['role'] as UserRole,
      games: data['games'],
      isActive: data['isActive'],
      createdAt: data['createdAt'].toDate(), // Converti da Timestamp a Date
      updatedAt: data['updatedAt'].toDate() // Converti da Timestamp a Date
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
      members: team.members,
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
      members: data['members'],
      isActive: data['isActive'],
      createdAt: timestampToDate(data['createdAt'] as Timestamp),
      updatedAt: timestampToDate(data['updatedAt'] as Timestamp)
    };
  }
};

export const userGameConverter: FirestoreDataConverter<UserGame> = {
  toFirestore(game: UserGame): DocumentData {
    return {
      userId: game.userId,
      eventId: game.eventId,
      teamId: game.teamId,
      challenges: game.challenges.map((challengeRef) => challengeRef.path) // Salva il percorso del riferimento
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions): UserGame {
    const data = snapshot.data(options)!;
    return {
      userId: data['userId'],
      eventId: data['eventId'],
      teamId: data['teamId'],
      challenges: (data['challenges'] || []).map((challengePath: string) => {
        return doc(snapshot.ref.firestore, challengePath) as DocumentReference<UserChallenge>;
      })
    };
  }
};
