export type User = {
  // id: string; // ID univoco dell'utente
  name: string; // Nome dell'utente
  lastname: string; // Cognome dell'utente
  username: string; // Nome utente o nickname
  email: string; // Email dell'utente
  defaultCode: string; // Codice di default per creare o partecipare a squadre
  type: UserType;
  birthDate: Date; // Data di nascita dell'utente
  challengePoints: ChallengePoint[]; // Lista delle sfide completate
  isActive: boolean; // Se il documento è attivo
  createdAt: Date; // Data di creazione dell'account
  updatedAt: Date; // Data dell'ultimo aggiornamento dell'account
};

export type ChallengePoint = {
  challengeId: string; // ID della sfida completata
  eventId: string; // ID dell'evento associato alla sfida
  completionDate: Date; // Data di completamento della sfida
};

export enum UserType {
  USER = 'USER',
  ADMIN = 'ADMIN'
}
