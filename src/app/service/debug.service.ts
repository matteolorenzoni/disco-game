import { Injectable, inject } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { Debug } from '../model/debug.model';

const COL_DEBUGS = environment.collection.DEBUGS;

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);

  /* --------------------------- Create ---------------------------*/
  public async add(form: Debug): Promise<void> {
    await this.documentService.addDocument<Debug>(COL_DEBUGS, form);
  }
}
