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
import { StorageService } from './storage.service';

const COL_EVENTS = environment.collection.EVENTS;

@Injectable({
  providedIn: 'root'
})
export class EventService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);
  protected readonly storageService = inject(StorageService);

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
    return await this.documentService.getDocumentWithConstraints<Event>(COL_EVENTS, valueConstraints, eventConverter);
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
  public createId(): string {
    return this.documentService.createDocId(COL_EVENTS);
  }

  public async add(eventId: string, form: EventModel, imageUrl: string): Promise<string> {
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

  public async addImage(image: File, name: string) {
    return await this.storageService.saveImage(image, COL_EVENTS, name);
  }

  /* --------------------------- Update ---------------------------*/
  public async update(eventId: string, form: EventModel, imageUrl: string): Promise<void> {
    await this.documentService.updateDocuments<Event>([eventId], COL_EVENTS, {
      ...form,
      imageUrl,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate)
    });
  }

  public async updateImage(image: File, name: string): Promise<string> {
    return await this.storageService.updateImage(image, COL_EVENTS, name);
  }

  public async updateProps(eventIds: string[], data: Partial<Event>): Promise<void> {
    await this.documentService.updateDocuments<Event>(eventIds, COL_EVENTS, data);
  }

  public async updateTeams(operation: 'ADD' | 'REMOVE', eventId: string, teamId: string): Promise<void> {
    await this.documentService.updateDocumentArray<Event, string>(operation, eventId, COL_EVENTS, 'teamIds', teamId);
  }

  /* --------------------------- Delete ---------------------------*/
  public async softDelete(challengeId: string): Promise<void> {
    await this.documentService.updateDocuments<Event>([challengeId], COL_EVENTS, { isActive: false });
  }
}
