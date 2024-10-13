import { DocumentReference } from 'firebase/firestore';
import { UserEventTeam } from './user-event-team.model';

export type User = {
  name: string; // Nome dell'utente
  lastName: string; // Cognome dell'utente
  userName: string; // Nickname scelto dall'utente per identificarsi
  email: string; // Indirizzo email dell'utente, utilizzato per la registrazione e la comunicazione
  imageUrl: string | null; // URL dell'immagine del profilo dell'utente; può essere null se non è stato caricato nessun profilo
  role: UserRole; // Ruolo dell'utente nel sistema; determina i permessi e le funzionalità accessibili (USER o ADMIN)
  userEventTeamRefs: DocumentReference<UserEventTeam>[]; // Array di riferimenti ai documenti delle squadre a cui l'utente ha partecipato o creato nel tempo
  isActive: boolean; // Flag per gestire la soft delete
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento delle informazioni dell'account
};

// Enumerazione che definisce i possibili ruoli degli utenti nel sistema
export enum UserRole {
  USER = 'USER', // Ruolo standard per gli utenti normali, con accesso limitato
  ADMIN = 'ADMIN' // Ruolo per gli amministratori, con accesso a funzionalità avanzate di gestione
}
