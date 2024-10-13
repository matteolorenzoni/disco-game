import { DocumentReference } from 'firebase/firestore';
import { UserEventTeam } from './user-event-team.model';

export type Team = {
  leaderId: string; // ID dell'utente che ha creato la squadra
  name: string; // Nome della squadra
  description: string; // Descrizione della squadra, fornisce informazioni aggiuntive sulla squadra stessa
  code: string; // Codice unico di default per la creazione o la partecipazione a squadre; utilizzato per invitare altri membri
  status: TeamStatus; // Stato corrente della squadra, indica se è attiva, sospesa o bannata
  userEventTeamRefs: DocumentReference<UserEventTeam>[]; // Array di riferimenti ai documenti delle squadre a cui l'utente ha partecipato o creato nel tempo, utile per la gestione delle squadre
  isActive: boolean; // Flag per gestire la soft delete
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento delle informazioni della squadra, per monitorare le modifiche
};

// Enumerazione che definisce i possibili stati di una squadra
export enum TeamStatus {
  ACTIVE = 'ACTIVE', // La squadra è attiva e può partecipare alle sfide, tutte le funzionalità sono disponibili
  BANNED = 'BANNED', // La squadra è stata bannata a causa di violazioni delle regole e non può partecipare a eventi
  SUSPENDED = 'SUSPENDED' // La squadra è temporaneamente sospesa; può essere riattivata dopo una revisione
}
