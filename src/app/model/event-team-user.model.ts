export type EventTeamUser = {
  eventId: string; // ID evento
  teamId: string; // ID squadra
  userId: string; // ID utente
  challenges: EventTeamUserChallenge[];
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento della sfida
};

export type EventTeamUserChallenge = {
  challengeId: string;
  timestamps: Date[];
  totalPoints: number;
};
