export type Team = {
  // id: string; // ID univoco della squadra
  userId: string; // ID dell'utente che ha creato la squadra
  eventId: string; // ID dell'evento collegato
  name: string; // Nome della squadra
  description: string; // Descrizione della squadra
  code: string; // Codice di default per creare o partecipare a squadre
  status: TeamStatus; // Stato della squadra (es: "active", "disbanded")
  memberIds: string[]; // Array di ID degli utenti membri della squadra
  isActive: boolean; // Per soft delete
  createdAt: Date; // Data di creazione della squadra
  updatedAt: Date; // Data dell'ultimo aggiornamento della squadra
};

export enum TeamStatus {
  ACTIVE = 'ACTIVE', // La squadra è attiva e può partecipare alle sfide
  BANNED = 'BANNED', // La squadra è stata bannata e non può partecipare
  SUSPENDED = 'SUSPENDED' // La squadra è temporaneamente sospesa, potrebbe essere riattivata
}
