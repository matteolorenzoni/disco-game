import { DocumentReference } from 'firebase/firestore';
import { UserChallenge } from './user-challenge.model';

export type UserGame = {
  userId: string; // ID dell'utente che è il leader della squadra
  eventId: string; // ID dell'evento a cui è associata la squadra
  teamId: string; // ID della squadra
  challenges: DocumentReference<UserChallenge>[]; // Elenco delle sfide completate dalla squadra
};
