import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { Event } from '../model/event.model';
import { EventModel } from '../model/form.model';
import { eventConverter } from '../model/converter';
import { Doc } from '../model/firebase';
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

  /* --------------------------- Read ---------------------------*/
  //! [INDEX]
  public async getAllEvents(): Promise<Doc<Event>[]> {
    const orderConstraints = [orderBy('startDate', 'desc')];
    return this.documentService.getDocumentsWithConstraints<Event>(COL_EVENTS, orderConstraints, eventConverter);
  }

  public async getEventById(eventId: string): Promise<Doc<Event>> {
    return this.documentService.getDocumentById<Event>(COL_EVENTS, eventId, eventConverter);
  }

  public async getEventByCode(code: string): Promise<Doc<Event> | null> {
    const valueConstraints = [where('code', '==', code)];
    const events = await this.documentService.getDocumentsWithConstraints<Event>(
      COL_EVENTS,
      valueConstraints,
      eventConverter
    );
    return events.length ? events[0] : null;
  }

  //! [INDEX]
  public async getActiveEvents(): Promise<Doc<Event>[]> {
    const valueConstraints = [where('startDate', '>=', dateYesterday())];
    const orderConstraints = [orderBy('startDate', 'asc')];
    return this.documentService.getDocumentsWithConstraints<Event>(
      COL_EVENTS,
      [...valueConstraints, ...orderConstraints],
      eventConverter
    );
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventById(eventId: string, form: EventModel, imageUrl: string): Promise<string> {
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
    return docRef.id;
  }

  /* --------------------------- Update ---------------------------*/
  public async updateEvent(eventId: string, form: EventModel): Promise<void> {
    await this.documentService.updateDocument<Event>(eventId, COL_EVENTS, {
      ...form,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate)
    });
  }

  public async updateEventImageUrl(eventId: string, imageUrl: string): Promise<void> {
    await this.documentService.updateDocument<Event>(eventId, COL_EVENTS, { imageUrl });
  }

  public async updateTeams(operation: 'ADD' | 'REMOVE', eventId: string, teamId: string): Promise<void> {
    await this.documentService.updateDocumentArray<Event, string>(operation, eventId, COL_EVENTS, 'teamIds', teamId);
  }
}
