import { DocumentReference } from 'firebase/firestore';
import { EventChallenge } from './event-challenge.model';

export type Event = {
  name: string; // Nome dell'evento
  description: string; // Descrizione dell'evento, inclusi dettagli come il tema e gli obiettivi
  location: string; // Luogo in cui si svolge l'evento, che può essere un indirizzo o un nome di una struttura
  imageUrl: string; // URL dell'immagine di copertura dell'evento
  challenges: DocumentReference<EventChallenge>[]; // Array di sfide collegate all'evento
  isActive: boolean; // Per soft delete
  startDate: Date; // Data e ora di inizio dell'evento
  endDate: Date; // Data e ora di fine dell'evento
  createdAt: Date; // Data e ora in cui l'evento è stato creato
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento dell'evento
};
