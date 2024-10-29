import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { EventChallenge } from '../model/event-challenge.model';
import { environment } from '../../environments/environment';
import { eventChallengeConverter } from '../model/converter';
import { Doc } from '../model/firebase';
import { HttpService } from './http.service';
import { orderBy, where } from 'firebase/firestore';

const COL_EVENT_CHALLENGES = environment.collection.EVENT_CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class EventChallengeService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);

  /* --------------------------- Read ---------------------------*/
  //! [INDEX]
  public async getEventChallengesByProp(
    props: { key: 'eventId' | 'challengeId'; value: string }[]
  ): Promise<Doc<EventChallenge>[]> {
    return await this.httpService.execute(async () => {
      const valueConstraints = props.map((x) => where(x.key, '==', x.value));
      const orderConstraints = [orderBy('challengeName', 'asc')];
      return await this.documentService.getDocumentsWithConstraints<EventChallenge>(
        COL_EVENT_CHALLENGES,
        [...valueConstraints, ...orderConstraints],
        eventChallengeConverter,
        false
      );
    });
  }

  public async getEventChallengeById(eventId: string, challengeId: string): Promise<Doc<EventChallenge>> {
    return await this.httpService.execute(async () => {
      const valueConstraints = [where('eventId', '==', eventId), where('challengeId', '==', challengeId)];
      const eventChallenges = await this.documentService.getDocumentsWithConstraints<EventChallenge>(
        COL_EVENT_CHALLENGES,
        valueConstraints,
        eventChallengeConverter
      );
      if (eventChallenges.length !== 1) throw new Error('noDocument', { cause: 'noDocument' });
      return eventChallenges[0];
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventChallenge(newEventChallenge: EventChallenge): Promise<Doc<EventChallenge>> {
    return await this.httpService.execute(async () => {
      const docRef = await this.documentService.addDocument<EventChallenge>(COL_EVENT_CHALLENGES, newEventChallenge);
      return { id: docRef.id, props: newEventChallenge };
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

  /* --------------------------- Delete ---------------------------*/
  public async deleteEventChallenge(eventChallengeId: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.deleteDocument(eventChallengeId, COL_EVENT_CHALLENGES);
    });
  }
}
