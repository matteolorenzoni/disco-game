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
import { dateYesterday } from '../util/type.util';

const COL_EVENTS = environment.collection.EVENTS;

@Injectable({
  providedIn: 'root'
})
export class EventService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);
  private readonly httpService = inject(HttpService);
  private readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  //! [INDEX]
  public async getAllEvents(): Promise<Doc<Event>[]> {
    return await this.httpService.execute(async () => {
      const orderConstraints = [orderBy('startDate', 'desc')];
      return this.documentService.getDocumentsWithConstraints<Event>(COL_EVENTS, orderConstraints, eventConverter);
    });
  }

  public async getEventById(eventId: string): Promise<Doc<Event>> {
    return await this.httpService.execute(async () => {
      return this.documentService.getDocumentById<Event>(COL_EVENTS, eventId, eventConverter);
    });
  }

  public async getEventByCode(code: string): Promise<Doc<Event> | null> {
    return await this.httpService.execute(async () => {
      const valueConstraints = [where('code', '==', code)];
      const events = await this.documentService.getDocumentsWithConstraints<Event>(
        COL_EVENTS,
        valueConstraints,
        eventConverter
      );
      return events.length ? events[0] : null;
    }, 0);
  }

  //! [INDEX]
  public async getActiveEvents(): Promise<Doc<Event>[]> {
    return await this.httpService.execute(async () => {
      const valueConstraints = [where('startDate', '>=', dateYesterday())];
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
        teamIds: [],
        code,
        isActive: true,
        updatedAt: new Date()
      });
      this.logService.addLogConfirm('Evento aggiunto');
      return docRef.id;
    }, 0);
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
    }, 0);
  }

  public async updateEventImageUrl(eventId: string, imageUrl: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateDocument<Event>(eventId, COL_EVENTS, { imageUrl });
    }, 0);
  }

  public async updateTeams(operation: 'ADD' | 'REMOVE', eventId: string, teamId: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateDocumentArray<Event, string>(operation, eventId, COL_EVENTS, 'teamIds', teamId);
    }, 0);
  }
}
