import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { ChallengeModel } from '../model/form.model';
import { challengeConverter } from '../model/converter';
import { Challenge } from '../model/challenge.model';
import { Doc } from '../model/firebase';
import { orderBy } from 'firebase/firestore';

const COL_CHALLENGES = environment.collection.CHALLENGES;

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);

  /* --------------------------- Read ---------------------------*/
  //! [INDEX]
  public async getAllChallenges(): Promise<Doc<Challenge>[]> {
    const orderConstraints = [orderBy('name', 'asc')];
    return this.documentService.getDocumentsWithConstraints<Challenge>(
      COL_CHALLENGES,
      orderConstraints,
      challengeConverter
    );
  }

  public async getChallengeById(challengeId: string): Promise<Doc<Challenge>> {
    return await this.documentService.getDocumentById<Challenge>(COL_CHALLENGES, challengeId, challengeConverter);
  }

  public async getChallengesByIds(challengeIds: string[]): Promise<Doc<Challenge>[]> {
    return this.documentService.getDocumentsByIds<Challenge>(COL_CHALLENGES, challengeIds, challengeConverter);
  }

  public subscribeChallenges(onUpdate: (documents: Doc<Challenge>[]) => void): () => void {
    return this.documentService.subscribeToDocumentsWithConstraints<Challenge>(
      COL_CHALLENGES,
      [],
      challengeConverter,
      onUpdate
    );
  }

  /* --------------------------- Create ---------------------------*/
  public async add(form: ChallengeModel): Promise<void> {
    await this.documentService.addDocument<Challenge>(COL_CHALLENGES, {
      ...form,
      isActive: true,
      updatedAt: new Date()
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async update(challengeId: string, form: ChallengeModel): Promise<void> {
    await this.documentService.updateDocuments<Challenge>([challengeId], COL_CHALLENGES, form);
  }

  /* --------------------------- Delete ---------------------------*/
  public async softDelete(challengeId: string): Promise<void> {
    await this.documentService.updateDocuments<Challenge>([challengeId], COL_CHALLENGES, { isActive: false });
  }
}
