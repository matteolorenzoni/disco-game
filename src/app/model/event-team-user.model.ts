import { DocumentReference } from 'firebase/firestore';
import { EventTeamUserChallenge } from './user-challenge.model';

export type EventTeamUser = {
  eventId: string; // ID evento
  teamId: string; // ID squadra
  userId: string; // ID utente
  userName: string; // Name dell'utente
  userTotalPoints: number; // Somma dei punti ottenuti nelle varie sfide
  teamName: string; // Nome della squadra
  teamLeaderId: string; // ID dell'utente leader della squadra
  eventTeamUserChallengeRefs: DocumentReference<EventTeamUserChallenge>[]; // Elenco delle sfide completate dall'utente per quella squadra
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento della sfida
};
