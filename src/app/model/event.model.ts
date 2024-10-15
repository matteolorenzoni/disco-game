import { DocumentReference } from 'firebase/firestore';
import { EventTeamUser } from './event-team-user.model';
import { EventChallenge } from './event-challenge.model';

export type Event = {
  name: string; // Nome dell'evento
  description: string; // Descrizione dettagliata dell'evento, che include informazioni sul tema, gli obiettivi e le attività previste
  location: string; // Luogo in cui si svolge l'evento
  imageUrl: string; // URL dell'immagine di copertura dell'evento
  startDate: Date; // Data e ora di inizio dell'evento
  endDate: Date; // Data e ora di fine dell'evento
  eventTeamUserRefs: DocumentReference<EventTeamUser>[]; // Array di riferimenti ai documenti delle squadre che hanno partecipato o sono state create per l'evento
  eventChallengeRefs: DocumentReference<EventChallenge>[]; // Array di riferimenti ai documenti delle sfide associate all'evento
  isActive: boolean; // Flag per gestire la soft delete
  updatedAt: Date; // Data e ora dell'ultimo aggiornamento delle informazioni dell'evento
};
