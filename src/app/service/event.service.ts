import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment.development';
import { Event } from '../model/event.model';
import { EventModel } from '../model/form.model';
import { eventConverter } from '../model/converter';
import { LogService } from './log.service';
import { Doc } from '../model/firebase';

const COL_EVENTS = environment.collection.EVENTS;

@Injectable({
  providedIn: 'root'
})
export class EventService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  public async getEventById(eventId: string): Promise<Doc<Event>> {
    return await this.documentService.getDocumentById<Event>(COL_EVENTS, eventId, eventConverter);
  }

  public async getEvents(): Promise<Doc<Event>[]> {
    return await this.documentService.getAllActiveDocuments<Event>(COL_EVENTS, eventConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventById(eventId: string, form: EventModel, imageUrl: string): Promise<string> {
    const docRef = await this.documentService.addDocumentById<Event>(eventId, COL_EVENTS, {
      ...form,
      imageUrl,
      challenges: [],
      isActive: true,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Evento aggiunto correttamente');
    return docRef.id;
  }

  /* --------------------------- Update ---------------------------*/
  public async updateEvent(eventId: string, form: EventModel): Promise<void> {
    await this.documentService.updateDocument<Event>(eventId, COL_EVENTS, {
      ...form,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Evento aggiornato correttamente');
  }

  public async updateEventImageUrl(eventId: string, imageUrl: string): Promise<void> {
    await this.documentService.updateDocument<Event>(eventId, COL_EVENTS, {
      imageUrl,
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Evento aggiornato correttamente');
  }
}
