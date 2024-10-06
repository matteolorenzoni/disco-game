import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { LogService } from './log.service';
import { EventChallenge } from '../model/event-challenge.model';
import { environment } from '../../environments/environment.development';
import { eventChallengeConverter } from '../model/converter';
import { Doc } from '../model/firebase';

const COL_EVENT_CHALLENGES = environment.collection.EVENT_CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class EventChallengeService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  public async getEventChallengesByEventId(eventId: string): Promise<Doc<EventChallenge>[]> {
    return await this.documentService.getDocumentsByProp<EventChallenge>(
      COL_EVENT_CHALLENGES,
      { eventId },
      eventChallengeConverter
    );
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventChallenge(newEventChallenge: EventChallenge): Promise<string> {
    const docRef = await this.documentService.addDocument<EventChallenge>(COL_EVENT_CHALLENGES, newEventChallenge);
    this.logService.addLogConfirm('Sfida aggiunta');
    return docRef.id;
  }

  /* --------------------------- Create ---------------------------*/
  public async updateEventChallenge(eventChallengeId: string, form: EventChallenge): Promise<void> {
    await this.documentService.updateDocument<EventChallenge>(eventChallengeId, COL_EVENT_CHALLENGES, {
      ...form,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null
    });
    this.logService.addLogConfirm('Sfida aggiornata');
  }
}
