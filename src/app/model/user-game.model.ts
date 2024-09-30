import { DocumentReference } from 'firebase/firestore';
import { UserChallenge } from './user-challenge.model';

export type UserGame = {
  userId: string; // ID dell'utente
  userName: string; // Name dell'utente
  userIdLeader: string; // ID dell'utente leader della squadra
  eventId: string; // ID dell'evento a cui è associata la squadra
  teamId: string; // ID della squadra
  teamName: string; // Nome della squadra
  challenges: DocumentReference<UserChallenge>[]; // Elenco delle sfide completate dalla squadra
  points: number; // Somma dei punti ottenuti nelle varie sfide
};
