export type Challenge = {
  name: string; // Nome sfida
  description: string; // Descrizione della sfida
  rules: string; // Regole della sfida
  type: ChallengeType; // Tipo della sfida
  points: number; // Punti assegnati per il completamento della sfida
  complexity: number; // Complessità della sfida, da 1 (facile) a 5 (difficile)
  isActive: boolean; // Per soft delete
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento della sfida
};

export enum ChallengeType {
  ALBERO = 'albero',
  ALIENO = 'alieno',
  BASKET = 'basket',
  BELLEZZA = 'bellezza',
  CANTANTE = 'cantante',
  COCKTAIL = 'cocktail',
  DJ = 'dj',
  JAM_OUT = 'jam_out',
  LINGUA = 'lingua',
  MELANZANA = 'melanzana',
  SHOPPING_BAG = 'shopping_bag',
  SKATE = 'skate',
  STATUA_LIBERTA = 'statua_liberta',
  TRAGUARDO = 'traguardo'
}
