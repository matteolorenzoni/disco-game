import { inject, Injectable } from '@angular/core';
import { DocumentData, DocumentReference } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { Doc } from '../model/firebase';
import { EventTeamUser } from '../model/event-team-user.model';
import { eventTeamUserConverter } from '../model/converter';
import { FirebaseDocumentService } from './firebase-document.service';
import { HttpService } from './http.service';

const COL_EVENT_TEAM_USERS = environment.collection.EVENT_TEAM_USERS;

@Injectable({
  providedIn: 'root'
})
export class EventTeamUserService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);

  /* --------------------------- Read ---------------------------*/
  public async getEventTeamUsersByProp(
    prop: 'userId' | 'eventId' | 'teamId',
    value: string
  ): Promise<Doc<EventTeamUser>[]> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentsByProp<EventTeamUser>(
        COL_EVENT_TEAM_USERS,
        { [prop]: value },
        eventTeamUserConverter
      );
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventTeamUser(
    eventId: string,
    teamId: string,
    userId: string,
    userName: string,
    teamName: string,
    teamLeaderId: string
  ): Promise<DocumentReference<DocumentData, DocumentData>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.addDocument<EventTeamUser>(COL_EVENT_TEAM_USERS, {
        eventId,
        teamId,
        userId,
        userName,
        teamName,
        teamLeaderId,
        userTotalPoints: 0,
        eventTeamUserChallengeRefs: [],
        updatedAt: new Date()
      });
    });
  }
}
