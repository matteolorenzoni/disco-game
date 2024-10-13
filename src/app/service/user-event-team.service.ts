import { inject, Injectable } from '@angular/core';
import { DocumentData, DocumentReference } from 'firebase/firestore';
import { environment } from '../../environments/environment.development';
import { Doc } from '../model/firebase';
import { UserEventTeam } from '../model/user-event-team.model';
import { userEventTeamConverter } from '../model/converter';
import { FirebaseDocumentService } from './firebase-document.service';
import { HttpService } from './http.service';

const COL_USER_EVENT_TEAM = environment.collection.USER_EVENT_TEAMS;

@Injectable({
  providedIn: 'root'
})
export class UserEventTeamService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);

  /* --------------------------- Read ---------------------------*/
  public async getUserGamesByRefs(
    userGameReferences: DocumentReference<UserEventTeam>[]
  ): Promise<Doc<UserEventTeam>[]> {
    return await this.httpService.execute(async () => {
      const promises = userGameReferences.map(
        async (userGameRef) =>
          await this.documentService.getDocumentById<UserEventTeam>(
            COL_USER_EVENT_TEAM,
            userGameRef.id,
            userEventTeamConverter
          )
      );
      return await Promise.all(promises);
    });
  }

  public async getUserEventTeamByProp(
    prop: 'userId' | 'eventId' | 'teamId',
    value: string
  ): Promise<Doc<UserEventTeam>[]> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentsByProp<UserEventTeam>(
        COL_USER_EVENT_TEAM,
        { [prop]: value },
        userEventTeamConverter
      );
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addUserEventTeam(
    userId: string,
    eventId: string,
    teamId: string,
    leaderId: string,
    userName: string,
    teamName: string
  ): Promise<DocumentReference<DocumentData, DocumentData>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.addDocument<UserEventTeam>(COL_USER_EVENT_TEAM, {
        userId,
        eventId,
        teamId,
        leaderId,
        userName,
        teamName,
        totalPoints: 0,
        userEventTeamChallengeRefs: [],
        updatedAt: new Date()
      });
    });
  }
}
