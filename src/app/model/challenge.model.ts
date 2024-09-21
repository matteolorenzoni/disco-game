export type Challenge = {
  // id: string; // ID univoco della sfida
  name: string;
  description: string; // Descrizione della sfida
  rules: string; // Regole della sfida
  imageUrl: string | null; // URL immagine
  points: number; // Punti assegnati per il completamento della sfida
  maxTimes: number | null; // NUmero di volte che una sfida può essere ripetuta
  complexity: number; // Complessità della sfida, da 1 (facile) a 5 (difficile)
  status: ChallengeStatus; // Stato della sfida
  isActive: boolean; // Per soft delete
  startDate: Date; // Data e ora di inizio della sfida
  endDate: Date; // Data e ora di fine della sfida
  createdAt: Date; // Data e ora in cui la sfida è stata creata
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento della sfida
};

export enum ChallengeStatus {
  ACTIVE = 'ACTIVE', // Sfida attiva e in corso
  LOCKED = 'LOCKED', // Sfida in attesa di inizio
  CANCELED = 'CANCELED', // Sfida annullata
  SUSPENDED = 'SUSPENDED' // Sfida sospesa temporaneamente
}
