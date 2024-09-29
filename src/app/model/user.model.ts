import { DocumentReference } from 'firebase/firestore';

export type User = {
  // id: string; // ID univoco dell'utente
  name: string; // Nome dell'utente
  lastname: string; // Cognome dell'utente
  username: string; // Nome utente o nickname
  email: string; // Indirizzo email dell'utente
  birthDate: Date; // Data di nascita dell'utente
  imageUrl: string | null; // URL dell'immagine del profilo, null se non presente
  role: UserRole; // Ruolo dell'utente (USER o ADMIN)
  games: DocumentReference<UserGame>[]; // Elenco delle squadre create o a cui l'utente ha partecipato nel tempo
  isActive: boolean; // Indica se l'utente è attivo (true) o se è stato disattivato (false)
  createdAt: Date; // Data di creazione dell'account dell'utente
  updatedAt: Date; // Data dell'ultimo aggiornamento delle informazioni dell'account
};

export type UserGame = {
  userId: string; // ID dell'utente che è il leader della squadra
  eventId: string; // ID dell'evento a cui è associata la squadra
  teamId: string; // ID della squadra
  challenges: DocumentReference<UserChallenge>[]; // Elenco delle sfide completate dalla squadra
};

export type UserChallenge = {
  challengeId: string; // ID della sfida completata
  count: number; // Numero di volte che la sfida è stata completata
  completionDates: Date[]; // Array delle date di completamento della sfida
};

export enum UserRole {
  USER = 'USER', // Ruolo per gli utenti normali
  ADMIN = 'ADMIN' // Ruolo per gli amministratori
}
