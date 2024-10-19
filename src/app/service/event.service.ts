import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { Event } from '../model/event.model';
import { EventModel } from '../model/form.model';
import { eventConverter } from '../model/converter';
import { LogService } from './log.service';
import { Doc } from '../model/firebase';
import { HttpService } from './http.service';
import { generateRandomCode } from '../util/utils';

const COL_EVENTS = environment.collection.EVENTS;
const COL_EVENT_TEAM_USERS = environment.collection.EVENT_TEAM_USERS;
const COL_EVENT_CHALLENGES = environment.collection.EVENT_CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class EventService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);
  readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  public async getEvents(): Promise<Doc<Event>[]> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentsByProp<Event>(COL_EVENTS, { isActive: true }, eventConverter);
    });
  }

  public async getEventById(eventId: string): Promise<Doc<Event>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentById<Event>(COL_EVENTS, eventId, eventConverter);
    });
  }

  public async getEvents(): Promise<Doc<Event>[]> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getAllActiveDocuments<Event>(COL_EVENTS, eventConverter);
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventById(eventId: string, form: EventModel, imageUrl: string): Promise<string> {
    return await this.httpService.execute(async () => {
      const events = await this.getEvents();
      const codes = events.map((x) => x.props.code);

      /* Check codice univoco */
      if (codes.length > 2_000_000) {
        throw new Error('tooManyEvents', { cause: 'tooManyEvents' });
      }
      let code = generateRandomCode(6);
      while (codes.includes(code)) {
        code = generateRandomCode(6);
      }

      const docRef = await this.documentService.addDocumentById<Event>(eventId, COL_EVENTS, {
        ...form,
        imageUrl,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        eventTeamUserRefs: [],
        eventChallengeRefs: [],
        code,
        isActive: true,
        updatedAt: new Date()
      });
      this.logService.addLogConfirm('Evento aggiunto');
      return docRef.id;
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async updateEvent(eventId: string, form: EventModel): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateDocument<Event>(eventId, COL_EVENTS, {
        ...form,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate)
      });
      this.logService.addLogConfirm('Evento aggiornato');
    });
  }

  public async updateEventImageUrl(eventId: string, imageUrl: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateDocument<Event>(eventId, COL_EVENTS, { imageUrl });
    });
  }

  public async updateEventTeamUser(eventId: string, eventTeamUserId: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateArrayPropReference<Event>(
        'add',
        'eventTeamUserRefs',
        `${COL_EVENTS}/${eventId}`,
        `${COL_EVENT_TEAM_USERS}/${eventTeamUserId}`
      );
    });
  }

  public async updateEventChallenge(eventId: string, eventChallengeId: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateArrayPropReference<Event>(
        'add',
        'eventChallengeRefs',
        `${COL_EVENTS}/${eventId}`,
        `${COL_EVENT_CHALLENGES}/${eventChallengeId}`
      );
    });
  }
}
