import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment.development';
import { Event } from '../model/event.model';
import { EventModel } from '../model/form.model';
import { eventConverter } from '../model/converter.model';
import { LogService } from './log.service';

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
  public async getEventById(eventId: string) {
    return await this.documentService.getDocumentById<Event>(this.COLLECTION, eventId, eventConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addEvent(form: EventModel): Promise<void> {
    await this.documentService.addDocument<Event>(this.COLLECTION, {
      ...form,
      challenges: [],
      isActive: true,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Evento aggiunto correttamente');
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
}
