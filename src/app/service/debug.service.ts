import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { DebugDto } from './../model/debug.model';
import { FirebaseDocumentService } from './firebase-document.service';

const COL_DEBUGS = environment.collection.DEBUGS;

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);

  /* --------------------------- Create ---------------------------*/
  public async add(debug: DebugDto): Promise<void> {
    await this.documentService.addDocument<DebugDto>(COL_DEBUGS, debug);
  }
}
