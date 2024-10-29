import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { ChallengeModel } from '../model/form.model';
import { challengeConverter } from '../model/converter';
import { Challenge } from '../model/challenge.model';
import { Doc } from '../model/firebase';
import { HttpService } from './http.service';
import { orderBy } from 'firebase/firestore';

const COL_CHALLENGES = environment.collection.CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);
  private readonly httpService = inject(HttpService);

  /* --------------------------- Read ---------------------------*/
  //! [INDEX]
  public async getAllChallenges(): Promise<Doc<Challenge>[]> {
    return await this.httpService.execute(async () => {
      const orderConstraints = [orderBy('name', 'asc')];
      return this.documentService.getDocumentsWithConstraints<Challenge>(
        COL_CHALLENGES,
        orderConstraints,
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

  /* --------------------------- Delete ---------------------------*/
  public async softDeleteChallenge(challengeId: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateDocument<Challenge>(challengeId, COL_CHALLENGES, { isActive: false });
    });
  }
}
