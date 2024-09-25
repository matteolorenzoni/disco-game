import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment.development';
import { Event } from '../model/event.model';
import { EventModel } from '../model/form.model';
import { eventConverter } from '../model/converter.model';
import { LogService } from './log.service';
import { Doc } from '../model/firebase.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly logService = inject(LogService);

  /* Constants */
  COLLECTION = environment.collection.EVENTS;

  /* --------------------------- Read ---------------------------*/
  public async getEventById(eventId: string): Promise<Doc<Event>> {
    return await this.documentService.getDocumentById<Event>(this.COLLECTION, eventId, eventConverter);
  }

  public async getEvents(): Promise<Doc<Event>[]> {
    return await this.documentService.getAllDocuments<Event>(this.COLLECTION, eventConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addEvent(form: EventModel, imageUrl: string | null): Promise<string> {
    const docRef = await this.documentService.addDocument<Event>(this.COLLECTION, {
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
    await this.documentService.updateDocument<Event>(eventId, this.COLLECTION, {
      ...form,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Evento aggiornato correttamente');
  }

  public async updateEventImageUrl(eventId: string, imageUrl: string | null): Promise<void> {
    await this.documentService.updateDocument<Event>(eventId, this.COLLECTION, {
      imageUrl,
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Evento aggiornato correttamente');
  }
}
