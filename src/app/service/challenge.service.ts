import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { ChallengeModel } from '../model/form.model';
import { challengeConverter } from '../model/converter';
import { Challenge } from '../model/challenge.model';
import { Doc } from '../model/firebase';
import { HttpService } from './http.service';

const COL_CHALLENGES = environment.collection.CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);
  private readonly httpService = inject(HttpService);

  /* --------------------------- Read ---------------------------*/
  public async getChallenges(): Promise<Doc<Challenge>[]> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentsByProps<Challenge>(
        COL_CHALLENGES,
        { isActive: true },
        challengeConverter
      );
    });
  }

  public async getChallengeById(challengeId: string): Promise<Doc<Challenge>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentById<Challenge>(COL_CHALLENGES, challengeId, challengeConverter);
    });
  }

  public async getChallengesByIds(challengeIds: string[]): Promise<Doc<Challenge>[]> {
    return await this.httpService.execute(async () => {
      return this.documentService.getDocumentsByIds<Challenge>(COL_CHALLENGES, challengeIds, challengeConverter);
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addChallenge(form: ChallengeModel): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.addDocument<Challenge>(COL_CHALLENGES, {
        ...form,
        isActive: true,
        updatedAt: new Date()
      });
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async updateChallenge(challengeId: string, form: ChallengeModel): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateDocument<Challenge>(challengeId, COL_CHALLENGES, form);
    });
  }
}
