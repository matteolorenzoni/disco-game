import { DocumentReference } from 'firebase/firestore';
import { UserEventTeamChallenge } from './user-challenge.model';

export type UserEventTeam = {
  userId: string; // ID utente
  eventId: string; // ID evento
  teamId: string; // ID squadra
  leaderId: string; // ID dell'utente leader della squadra
  userName: string; // Name dell'utente
  teamName: string; // Nome della squadra
  totalPoints: number; // Somma dei punti ottenuti nelle varie sfide
  userEventTeamChallengeRefs: DocumentReference<UserEventTeamChallenge>[]; // Elenco delle sfide completate dall'utente per quella squadra
};
