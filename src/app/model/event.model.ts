import { DocumentReference } from 'firebase/firestore';
import { EventChallenge } from './event-challenge.model';

export type Event = {
  name: string;
  description: string;
  code: string;
  location: string;
  imageUrl: string;
  startDate: Date;
  endDate: Date;
  teamIds: string[];
  eventChallengeRefs: DocumentReference<EventChallenge>[];
  isActive: boolean;
  updatedAt: Date;
};
