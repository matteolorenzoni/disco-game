import { Injectable, inject } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { NewTeamModel } from '../model/form.model';
import { Team, TeamStatus } from '../model/team.model';
import { Doc } from '../model/firebase';
import { teamConverter } from '../model/converter';
import { HttpService } from './http.service';
import { generateUniqueCode } from '../util/utils';
import { limit, QueryConstraint, where } from 'firebase/firestore';
import { User } from '../model/user.model';
import { dateYesterday } from '../util/type.util';

const COL_TEAMS = environment.collection.TEAMS;

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);
  private readonly httpService = inject(HttpService);

  /* --------------------------- Read ---------------------------*/
  public async getTeamById(teamId: string): Promise<Doc<Team>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentById<Team>(COL_TEAMS, teamId, teamConverter);
    });
  }

  //! [INDEX]
  public async getActiveTeamsByUserId(userId: string, constraints: QueryConstraint[] = []): Promise<Doc<Team>[]> {
    return await this.httpService.execute(async () => {
      const valueConstraints = [
        where('userIds', 'array-contains', userId),
        where('eventStartDate', '>=', dateYesterday())
      ];
      return this.documentService.getDocumentsWithConstraints<Team>(
        COL_TEAMS,
        [...valueConstraints, ...constraints],
        teamConverter
      );
    });
  }

  public async getFirstActiveTeamByUserId(userId: string): Promise<Doc<Team> | null> {
    return await this.httpService.execute(async () => {
      const limitConstraints = [limit(1)];
      const teams = await this.getActiveTeamsByUserId(userId, limitConstraints);
      return teams.length !== 1 ? null : teams[0];
    });
  }

  public async getActiveTeamByUserAndEventId(userId: string, eventId: string): Promise<Doc<Team> | null> {
    return await this.httpService.execute(async () => {
      const valueConstraints = [
        where('eventId', '==', eventId),
        where('userIds', 'array-contains', userId),
        where('eventStartDate', '>=', dateYesterday())
      ];
      const teams = await this.documentService.getDocumentsWithConstraints<Team>(
        COL_TEAMS,
        valueConstraints,
        teamConverter
      );
      return teams.length !== 1 ? null : teams[0];
    });
  }

  public async getTeamByCode(code: string): Promise<Doc<Team> | null> {
    return await this.httpService.execute(async () => {
      const teams = await this.documentService.getDocumentsByProps<Team>(
        COL_TEAMS,
        { code, isActive: true },
        teamConverter
      );
      return teams.length !== 1 ? null : teams[0];
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addTeam(
    user: Doc<User>,
    eventId: string,
    eventStartDate: Date,
    teamForm: NewTeamModel
  ): Promise<Doc<Team> | undefined> {
    return await this.httpService.execute(async () => {
      /* Check nome univoco */
      const valueConstraints = [where('eventId', '==', eventId), where('name', '==', teamForm.name)];
      const teamsWithName = await this.documentService.getDocumentsWithConstraints<Team>(
        COL_TEAMS,
        valueConstraints,
        teamConverter
      );
      if (teamsWithName.length > 0) return; // Nome già esistente

      /* Check codice univoco */
      const code = await generateUniqueCode(6, 100, this.getTeamByCode.bind(this));

      /* Aggiungo evento al DB */
      const props: Team = {
        leaderId: user.id,
        name: teamForm.name,
        code,
        status: TeamStatus.ACTIVE,
        totalPoints: 0,
        eventId,
        eventStartDate,
        userIds: [user.id],
        users: [{ id: user.id, userName: user.props.userName, imageUrl: user.props.imageUrl, challenges: [] }],
        isActive: true,
        updatedAt: new Date()
      };
      const docRef = await this.documentService.addDocument<Team>(COL_TEAMS, props);

      /* Restituisco l'oggetto appena creato */
      return { id: docRef.id, props };
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async updateUsers(team: Doc<Team>, user: Doc<User>): Promise<void> {
    return await this.httpService.execute(async () => {
      team.props.userIds = [...team.props.userIds, user.id];
      team.props.users = [
        ...team.props.users,
        {
          id: user.id,
          userName: user.props.userName,
          imageUrl: user.props.imageUrl,
          challenges: []
        }
      ];
      await this.documentService.updateDocument<Team>(team.id, COL_TEAMS, team.props);
    });
  }

  public async updatePoints(team: Doc<Team>, userId: string, challengeId: string, points: number): Promise<void> {
    return await this.httpService.execute(async () => {
      // Aggiorno la squadra
      team.props.totalPoints += points;

      // Aggiorno l'user
      const user = team.props.users.find((user) => user.id === userId)!;
      const userChallenge = user.challenges.find((challenge) => challenge.id === challengeId);
      if (userChallenge) {
        userChallenge.totalPoints += points;
        userChallenge.timestamps.push(new Date());
      } else {
        user.challenges.push({ id: challengeId, timestamps: [new Date()], totalPoints: points });
      }
      await this.documentService.updateDocument<Team>(team.id, COL_TEAMS, team.props);
    });
  }

  /* --------------------------- Delete ---------------------------*/
  public async deleteFromTeam(team: Doc<Team>, userId: string): Promise<void> {
    return await this.httpService.execute(async () => {
      team.props.userIds = team.props.userIds.filter((x) => x !== userId);
      team.props.users = team.props.users.filter((x) => x.id !== userId);
      await this.documentService.updateDocument<Team>(team.id, COL_TEAMS, team.props);
    });
  }
}
