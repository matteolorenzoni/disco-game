import { inject, Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment.development';
import { Event } from '../model/event.model';
import { EventModel } from '../model/form.model';
import { eventConverter } from '../model/converter.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseEventService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);

  /* Constants */
  COLLECTION = environment.collection.EVENTS;

  /* --------------------------- Read ---------------------------*/
  public async getEventById(eventId: string) {
    return await this.firebaseService.getDocumentById<Event>(this.COLLECTION, eventId, eventConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addEvent(form: EventModel): Promise<void> {
    await this.firebaseService.addDocument<Event>(this.COLLECTION, {
      ...form,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      challenges: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async updateEvent(eventId: string, form: EventModel): Promise<void> {
    await this.firebaseService.updateDocument<Event>(eventId, this.COLLECTION, {
      ...form,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      updatedAt: new Date()
    });
  }
}
