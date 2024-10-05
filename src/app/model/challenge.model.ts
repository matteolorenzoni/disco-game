export type Challenge = {
  name: string; // Nome sfida
  description: string; // Descrizione della sfida
  rules: string; // Regole della sfida
  type: ChallengeType; // Tipo della sfida
  points: number; // Punti assegnati per il completamento della sfida
  complexity: number; // Complessità della sfida, da 1 (facile) a 5 (difficile)
  isActive: boolean; // Per soft delete
  createdAt: Date; // Data e ora in cui la sfida è stata creata
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento della sfida
};

export enum ChallengeType {
  CHAMELEON = 'chameleon',
  CRAB = 'crab',
  FLAMINGO = 'flamingo',
  FROG = 'frog',
  LION = 'lion',
  OWL = 'owl',
  PANDA = 'panda',
  PENGUIN = 'penguin',
  SLOTH = 'sloth',
  ZEBRA = 'zebra'
}
