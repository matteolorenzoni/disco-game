import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment.development';
import { ChallengeModel } from '../model/form.model';
import { challengeConverter } from '../model/converter';
import { LogService } from './log.service';
import { Challenge } from '../model/challenge.model';
import { Doc } from '../model/firebase';

const COL_CHALLENGES = environment.collection.CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  public async getChallengeById(challengeId: string): Promise<Doc<Challenge>> {
    return await this.documentService.getDocumentById<Challenge>(COL_CHALLENGES, challengeId, challengeConverter);
  }
  public async getChallenges(): Promise<Doc<Challenge>[]> {
    return await this.documentService.getAllActiveDocuments<Challenge>(COL_CHALLENGES, challengeConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addChallenge(form: ChallengeModel): Promise<void> {
    await this.documentService.addDocument<Challenge>(COL_CHALLENGES, {
      ...form,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Sfida aggiunta correttamente');
  }

  /* --------------------------- Update ---------------------------*/
  public async updateChallenge(challengeId: string, form: ChallengeModel): Promise<void> {
    await this.documentService.updateDocument<Challenge>(challengeId, COL_CHALLENGES, {
      ...form,
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Sfida aggiornata correttamente');
  }
}
