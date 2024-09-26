export type User = {
  // id: string; // ID univoco dell'utente
  name: string; // Nome dell'utente
  lastname: string; // Cognome dell'utente
  username: string; // Nome utente o nickname
  email: string; // Email dell'utente
  birthDate: Date; // Data di nascita dell'utente
  imageUrl: string | null;
  role: UserRole; // URL immagine
  challengePoints: ChallengePoint[]; // Lista delle sfide completate
  isActive: boolean; // Per soft delete
  createdAt: Date; // Data di creazione dell'account
  updatedAt: Date; // Data dell'ultimo aggiornamento dell'account
};

export type ChallengePoint = {
  challengeId: string; // ID della sfida completata
  eventId: string; // ID dell'evento associato alla sfida
  completionDate: Date; // Data di completamento della sfida
};

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}
