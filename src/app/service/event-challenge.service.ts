import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { EventChallenge } from '../model/event-challenge.model';
import { environment } from '../../environments/environment';
import { eventChallengeConverter } from '../model/converter';
import { Doc } from '../model/firebase';
import { HttpService } from './http.service';

const COL_EVENT_CHALLENGES = environment.collection.EVENT_CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class EventChallengeService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);

  /* --------------------------- Read ---------------------------*/
  public async getEventChallengesByProp(
    props: { key: 'eventId' | 'challengeId'; value: string }[]
  ): Promise<Doc<EventChallenge>[]> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentsByProps<EventChallenge>(
        COL_EVENT_CHALLENGES,
        props.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {}),
        eventChallengeConverter
      );
    });
  }

  public async getEventChallengeByIds(eventId: string, challengeId: string): Promise<Doc<EventChallenge> | undefined> {
    return await this.httpService.execute(async () => {
      const eventChallenges = await this.documentService.getDocumentsByProps<EventChallenge>(
        COL_EVENT_CHALLENGES,
        { eventId, challengeId },
        eventChallengeConverter
      );
      return eventChallenges.length ? eventChallenges[0] : undefined;
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventChallenge(newEventChallenge: EventChallenge): Promise<string> {
    return await this.httpService.execute(async () => {
      const docRef = await this.documentService.addDocument<EventChallenge>(COL_EVENT_CHALLENGES, newEventChallenge);
      return docRef.id;
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async updateEventChallenge(eventChallengeId: string, form: EventChallenge): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateDocument<EventChallenge>(eventChallengeId, COL_EVENT_CHALLENGES, {
        ...form,
        startDate: form.startDate ? new Date(form.startDate) : null,
        endDate: form.endDate ? new Date(form.endDate) : null
      });
    });
  }
}
