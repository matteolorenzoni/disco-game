import { ChallengeType } from './challenge.model';

export type EventChallenge = {
  eventId: string; // ID evento
  eventStartDate: Date; // Data di inizio dell'evento
  challengeId: string; // ID della sfida collegata
  challengeName: string; // Nome della sfida collegata
  challengeType: ChallengeType; // Tipo della sfida collegata
  status: ChallengeStatus; // Stato della sfida
  maxTimes: number | null; // Numero di volte che una sfida può essere ripetuta
  startDate: Date | null; // Data e ora di inizio della sfida
  endDate: Date | null; // Data e ora di fine della sfida
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento della sfida
};

export enum ChallengeStatus {
  ACTIVE = 'ACTIVE', // Sfida attiva e in corso
  LOCKED = 'LOCKED', // Sfida in attesa di inizio
  CANCELED = 'CANCELED', // Sfida annullata
  SUSPENDED = 'SUSPENDED', // Sfida sospesa temporaneamente
  CHALLENGE_DELETED = 'CHALLENGE_DELETED' // Sfida (generale) eliminata
}

export type Qrcode = {
  teamId: string; // ID della squadra associata all'utente
  userId: string; // ID dell'utente che effettua la scansione
  challengeId: string; // ID della sfida a cui si riferisce il codice
  points: number; // Punti assegnati per la scansione della sfida
};
