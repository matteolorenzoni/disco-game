import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { Event } from '../model/event.model';
import { EventModel } from '../model/form.model';
import { eventConverter } from '../model/converter';
import { LogService } from './log.service';
import { Doc } from '../model/firebase';
import { HttpService } from './http.service';
import { generateUniqueCode } from '../util/utils';
import { orderBy, where } from 'firebase/firestore';

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
  //! [INDEX]
  public async getEvents(): Promise<Doc<Event>[]> {
    return await this.httpService.execute(async () => {
      const valueConstraints = [where('isActive', '==', true)];
      const orderConstraints = [orderBy('startDate', 'asc')];
      return this.documentService.getDocumentsWithConstraints<Event>(
        COL_EVENTS,
        [...valueConstraints, ...orderConstraints],
        eventConverter
      );
    });
  }

  public async getEventById(eventId: string): Promise<Doc<Event>> {
    return await this.httpService.execute(async () => {
      return this.documentService.getDocumentById<Event>(COL_EVENTS, eventId, eventConverter);
    });
  }

  public async getEventByCode(code: string): Promise<Doc<Event> | null> {
    return await this.httpService.execute(async () => {
      const valueConstraints = [where('code', '==', code), where('isActive', '==', true)];
      const events = await this.documentService.getDocumentsWithConstraints<Event>(
        COL_EVENTS,
        valueConstraints,
        eventConverter
      );
      return events.length ? events[0] : null;
    });
  }

  //! [INDEX]
  public async getEventsFromDate(): Promise<Doc<Event>[]> {
    return await this.httpService.execute(async () => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - 1);
      const valueConstraints = [where('startDate', '>=', date), where('isActive', '==', true)];
      const orderConstraints = [orderBy('startDate', 'asc')];
      return this.documentService.getDocumentsWithConstraints<Event>(
        COL_EVENTS,
        [...valueConstraints, ...orderConstraints],
        eventConverter
      );
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventById(eventId: string, form: EventModel, imageUrl: string): Promise<string> {
    return await this.httpService.execute(async () => {
      /* Check codice univoco */
      const code = await generateUniqueCode(6, 100, this.getEventByCode.bind(this));

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
