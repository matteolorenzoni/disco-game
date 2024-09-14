export type Event = {
  // id: string; // ID univoco dell'evento
  name: string; // Nome dell'evento
  description: string; // Descrizione dell'evento, inclusi dettagli come il tema e gli obiettivi
  startDate: Date; // Data e ora di inizio dell'evento
  endDate: Date; // Data e ora di fine dell'evento
  location: string; // Luogo in cui si svolge l'evento, che può essere un indirizzo o un nome di una struttura
  imageUrl: string | null; // URL dell'immagine di copertura dell'evento (opzionale)
  challenges: Challenge[]; // Array di sfide collegate all'evento
  isActive: boolean; // Stato dell'evento (true se attivo, false se non attivo)
  createdAt: Date; // Data e ora in cui l'evento è stato creato
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento dell'evento
};

export type Challenge = {
  challengeId: string; // ID della sfida collegata
  startDate: Date; // Data e ora di inizio della sfida
  endDate: Date; // Data e ora di fine della sfida
  status: ChallengeStatus; // Stato della sfida
};

export enum ChallengeStatus {
  ACTIVE = 'ACTIVE', // Sfida attiva e in corso
  COMPLETE = 'COMPLETE', // Sfida completata
  LOCKED = 'LOCKED', // Sfida in attesa di inizio
  CANCELED = 'CANCELED', // Sfida annullata
  SUSPENDED = 'SUSPENDED' // Sfida sospesa temporaneamente
}
