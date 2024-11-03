import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { ChallengeStatus, EventChallenge } from '../model/event-challenge.model';
import { environment } from '../../environments/environment';
import { eventChallengeConverter } from '../model/converter';
import { Doc } from '../model/firebase';
import { orderBy, where } from 'firebase/firestore';

const COL_EVENT_CHALLENGES = environment.collection.EVENT_CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class EventChallengeService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);

  /* --------------------------- Read ---------------------------*/
  //! [INDEX]
  public async getEventChallengesByProp(
    props: { key: 'eventId' | 'challengeId'; value: string }[]
  ): Promise<Doc<EventChallenge>[]> {
    const valueConstraints = props.map((x) => where(x.key, '==', x.value));
    const orderConstraints = [orderBy('challengeName', 'asc')];
    return await this.documentService.getDocumentsWithConstraints<EventChallenge>(
      COL_EVENT_CHALLENGES,
      [...valueConstraints, ...orderConstraints],
      eventChallengeConverter,
      false
    );
  }

  public async getEventChallengeById(eventId: string, challengeId: string): Promise<Doc<EventChallenge>> {
    const valueConstraints = [where('eventId', '==', eventId), where('challengeId', '==', challengeId)];
    const eventChallenges = await this.documentService.getDocumentsWithConstraints<EventChallenge>(
      COL_EVENT_CHALLENGES,
      valueConstraints,
      eventChallengeConverter,
      false
    );
    if (eventChallenges.length !== 1) throw new Error('noDocument', { cause: 'noDocument' });
    return eventChallenges[0];
  }

  public subscribeEventChallengesByProp(
    props: { key: 'eventId' | 'challengeId'; value: string }[],
    onUpdate: (documents: Doc<EventChallenge>[]) => void
  ): () => void {
    const valueConstraints = props.map((x) => where(x.key, '==', x.value));
    const orderConstraints = [orderBy('challengeName', 'asc')];
    return this.documentService.subscribeToDocumentsWithConstraints<EventChallenge>(
      COL_EVENT_CHALLENGES,
      [...valueConstraints, ...orderConstraints],
      eventChallengeConverter,
      onUpdate,
      false
    );
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventChallenge(newEventChallenge: EventChallenge): Promise<Doc<EventChallenge>> {
    const docRef = await this.documentService.addDocument<EventChallenge>(COL_EVENT_CHALLENGES, newEventChallenge);
    return { id: docRef.id, props: newEventChallenge };
  }

  /* --------------------------- Create ---------------------------*/
  public async updateEventChallenge(eventChallengeId: string, form: EventChallenge): Promise<void> {
    await this.documentService.updateDocuments<EventChallenge>([eventChallengeId], COL_EVENT_CHALLENGES, {
      ...form,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null
    });
  }

  public async updateEventChallengesStatus(eventChallengeIds: string[], status: ChallengeStatus): Promise<void> {
    await this.documentService.updateDocuments(eventChallengeIds, COL_EVENT_CHALLENGES, {
      status
    });
  }

  /* --------------------------- Delete ---------------------------*/
  public async deleteEventChallenges(eventChallengeIds: string[]): Promise<void> {
    await this.documentService.deleteDocuments(eventChallengeIds, COL_EVENT_CHALLENGES);
  }
}
