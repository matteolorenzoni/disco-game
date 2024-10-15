import { inject, Injectable } from '@angular/core';
import { DocumentData, DocumentReference } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { Doc } from '../model/firebase';
import { EventTeamUser } from '../model/event-team-user.model';
import { eventTeamUserConverter } from '../model/converter';
import { FirebaseDocumentService } from './firebase-document.service';
import { HttpService } from './http.service';

const COL_USER_EVENT_TEAM = environment.collection.USER_EVENT_TEAMS;

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
        COL_USER_EVENT_TEAM,
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
      return await this.documentService.addDocument<EventTeamUser>(COL_USER_EVENT_TEAM, {
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
