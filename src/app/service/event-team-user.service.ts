import { inject, Injectable } from '@angular/core';
import { DocumentData, DocumentReference, limit, orderBy, where } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { Doc } from '../model/firebase';
import { EventTeamUser } from '../model/event-team-user.model';
import { eventTeamUserConverter } from '../model/converter';
import { FirebaseDocumentService } from './firebase-document.service';
import { HttpService } from './http.service';
import { Qrcode } from '../model/event-challenge.model';

const COL_EVENT_TEAM_USERS = environment.collection.EVENT_TEAM_USERS;

@Injectable({
  providedIn: 'root'
})
export class EventTeamUserService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);

  /* --------------------------- Read ---------------------------*/
  //! [INDEX]
  public async getFirstEventTeamUserByUserIdFromDate(userId: string): Promise<Doc<EventTeamUser> | null> {
    const eventTeamUsers = await this.httpService.execute(async () => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - 1);
      const valueConstraints = [where('userId', '==', userId), where('eventStartDate', '>=', date)];
      const orderConstraints = [orderBy('eventStartDate', 'asc')];
      const limitConstraints = [limit(1)];
      return await this.documentService.getDocumentsWithConstraints<EventTeamUser>(
        COL_EVENT_TEAM_USERS,
        [...valueConstraints, ...orderConstraints, ...limitConstraints],
        eventTeamUserConverter
      );
    });
    return eventTeamUsers.length > 0 ? eventTeamUsers[0] : null;
  }

  public async getEventTeamUsersByProp(
    props: { key: 'userId' | 'eventId' | 'teamId'; value: string }[]
  ): Promise<Doc<EventTeamUser>[]> {
    return await this.httpService.execute(async () => {
      const valueConstraints = [...props.map((x) => where(x.key, '==', x.value))];
      return await this.documentService.getDocumentsWithConstraints<EventTeamUser>(
        COL_EVENT_TEAM_USERS,
        valueConstraints,
        eventTeamUserConverter
      );
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addEventTeamUser(
    eventId: string,
    teamId: string,
    userId: string,
    eventStartDate: Date
  ): Promise<DocumentReference<DocumentData, DocumentData>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.addDocument<EventTeamUser>(COL_EVENT_TEAM_USERS, {
        eventId,
        teamId,
        userId,
        challenges: [],
        eventStartDate,
        updatedAt: new Date()
      });
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async updateChallengePoints(qrcode: Qrcode): Promise<void> {
    return await this.httpService.execute(async () => {
      /* Cerco la partecipazione per vedere se la sfida è da aggiungere o da aggiornare */
      const eventTeamUser = await this.documentService.getDocumentsByProps<EventTeamUser>(
        COL_EVENT_TEAM_USERS,
        { eventId: qrcode.eventId, userId: qrcode.userId },
        eventTeamUserConverter
      );
      if (eventTeamUser.length === 0) throw new Error('noDocument', { cause: 'noDocument' });

      /* Aggiungo o aggiorno la nuova sfida superata */
      const challenges = eventTeamUser[0].props.challenges;
      const challenge = challenges.find((x) => x.challengeId === qrcode.challengeId);
      if (!challenge) {
        challenges.push({ challengeId: qrcode.challengeId, totalPoints: qrcode.points, timestamps: [new Date()] });
      } else {
        challenge.totalPoints += qrcode.points;
        challenge.timestamps.push(new Date());
      }
      await this.documentService.updateDocument<EventTeamUser>(eventTeamUser[0].id, COL_EVENT_TEAM_USERS, {
        challenges
      });
    });
  }
}
