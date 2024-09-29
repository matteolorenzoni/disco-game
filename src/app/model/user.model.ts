import { DocumentReference } from 'firebase/firestore';
import { UserGame } from './user-game.model';

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

export enum UserRole {
  USER = 'USER', // Ruolo per gli utenti normali
  ADMIN = 'ADMIN' // Ruolo per gli amministratori
}
