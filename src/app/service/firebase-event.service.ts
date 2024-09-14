import { inject, Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment.development';
import { Event } from '../model/event.model';
import { EventModel } from '../model/form.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseEventService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);

  /* Constants */
  COLLECTION = environment.collection.EVENTS;

  /* --------------------------- Create ---------------------------*/
  public async addEvent(form: EventModel): Promise<void> {
    /* Aggiunta documento a DB */
    await this.firebaseService.addDocument<Event>(this.COLLECTION, {
      ...form,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      challenges: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}
