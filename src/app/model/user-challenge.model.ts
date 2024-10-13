export type UserEventTeamChallenge = {
  userEventTeamId: string; // ID della squadra dell'utente per l'evento
  eventChallengeId: string; // ID della sfida dell'evento
  count: number; // Numero totale di volte in cui la sfida è stata completata dall'utente
  completionDates: Date[]; // Array che contiene le date in cui la sfida è stata completata
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento della sfida
};
