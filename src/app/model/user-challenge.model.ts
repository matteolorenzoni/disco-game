export type UserChallenge = {
  challengeId: string; // ID della sfida completata
  count: number; // Numero di volte che la sfida è stata completata
  completionDates: Date[]; // Array delle date di completamento della sfida
};
