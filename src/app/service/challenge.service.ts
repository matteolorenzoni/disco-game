import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment.development';
import { ChallengeModel } from '../model/form.model';
import { challengeConverter } from '../model/converter.model';
import { LogService } from './log.service';
import { Challenge } from '../model/challenge.model';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly logService = inject(LogService);

  /* Constants */
  COLLECTION = environment.collection.CHALLENGES;

  /* --------------------------- Read ---------------------------*/
  public async getChallengeById(challengeId: string) {
    return await this.documentService.getDocumentById<Challenge>(this.COLLECTION, challengeId, challengeConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addChallenge(form: ChallengeModel): Promise<void> {
    await this.documentService.addDocument<Challenge>(this.COLLECTION, {
      ...form,
      qrCodeUrl: '',
      isActive: true,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Sfida aggiunta correttamente');
  }

  /* --------------------------- Update ---------------------------*/
  public async updateChallenge(challengeId: string, form: ChallengeModel): Promise<void> {
    await this.documentService.updateDocument<Challenge>(challengeId, this.COLLECTION, {
      ...form,
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Sfida aggiornata correttamente');
  }
}
