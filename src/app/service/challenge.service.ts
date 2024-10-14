import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { ChallengeModel } from '../model/form.model';
import { challengeConverter, eventChallengeConverter } from '../model/converter';
import { LogService } from './log.service';
import { Challenge } from '../model/challenge.model';
import { Doc } from '../model/firebase';
import { HttpService } from './http.service';
import { DocumentReference } from 'firebase/firestore';
import { EventChallenge } from '../model/event-challenge.model';

const COL_CHALLENGES = environment.collection.CHALLENGES;
const COL_EVENT_CHALLENGES = environment.collection.EVENT_CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);
  readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  public async getChallengeById(challengeId: string): Promise<Doc<Challenge>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentById<Challenge>(COL_CHALLENGES, challengeId, challengeConverter);
    });
  }

  public async getChallenges(): Promise<Doc<Challenge>[]> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getAllActiveDocuments<Challenge>(COL_CHALLENGES, challengeConverter);
    });
  }

  public async getChallengesByEventChallengeRefs(
    eventChallengeRefs: DocumentReference<EventChallenge>[]
  ): Promise<Doc<Challenge>[]> {
    return await this.httpService.execute(async () => {
      /* EventChallenge */
      const eventChallengePromises = eventChallengeRefs.map(
        async (ref) => await this.documentService.getDocumentsByRefs<EventChallenge>(ref.path, eventChallengeConverter)
      );
      const eventChallenge = await Promise.all(eventChallengePromises);

      /* Challenge */
      const challengePromises = eventChallenge.map(
        async (doc) =>
          await this.documentService.getDocumentById<Challenge>(
            COL_CHALLENGES,
            doc.props.challengeId,
            challengeConverter
          )
      );
      return await Promise.all(challengePromises);
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addChallenge(form: ChallengeModel): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.addDocument<Challenge>(COL_CHALLENGES, {
        ...form,
        eventChallengeRefs: [],
        isActive: true,
        updatedAt: new Date()
      });
      this.logService.addLogConfirm('Sfida aggiunta');
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async updateChallenge(challengeId: string, form: ChallengeModel): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateDocument<Challenge>(challengeId, COL_CHALLENGES, form);
      this.logService.addLogConfirm('Sfida aggiornata');
    });
  }

  public async updateEventChallenge(eventId: string, eventChallengeId: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateArrayPropReference<Challenge>(
        'add',
        'eventChallengeRefs',
        `${COL_CHALLENGES}/${eventId}`,
        `${COL_EVENT_CHALLENGES}/${eventChallengeId}`
      );
    });
  }
}
