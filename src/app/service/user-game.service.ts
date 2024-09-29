import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { UserGame } from '../model/user-game.model';
import { Doc } from '../model/firebase';
import { userGameConverter } from '../model/converter';
import { FirebaseDocumentService } from './firebase-document.service';
import { DocumentData, DocumentReference } from 'firebase/firestore';

const COL_USER_GAMES = environment.collection.GAMES;

@Injectable({
  providedIn: 'root'
})
export class UserGameService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);

  /* Variables */
  userGames = signal<Doc<UserGame>[]>([]);

  /* --------------------------- Read ---------------------------*/
  public async getUserGamesByRefs(userGameReferences: DocumentReference<UserGame>[]): Promise<Doc<UserGame>[]> {
    const promises = userGameReferences.map(
      async (userGameRef) =>
        await this.documentService.getDocumentById<UserGame>(COL_USER_GAMES, userGameRef.id, userGameConverter)
    );
    return await Promise.all(promises);
  }

  /* --------------------------- Create ---------------------------*/
  public async addUserGame(
    userId: string,
    eventId: string,
    teamId: string
  ): Promise<DocumentReference<DocumentData, DocumentData>> {
    return await this.documentService.addDocument<UserGame>(COL_USER_GAMES, {
      userId,
      eventId,
      teamId,
      challenges: []
    });
  }
}
