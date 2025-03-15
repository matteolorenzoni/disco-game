import { Injectable, inject } from '@angular/core';
import { limit, orderBy, where } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { teamConverter } from '../model/converter';
import { Doc } from '../model/firebase';
import { Team, TeamStatus } from '../model/team.model';
import { User } from '../model/user.model';
import { dateYesterday } from '../util/type.util';
import { generateUniqueCode } from '../util/utils';
import { FirebaseDocumentService } from './firebase-document.service';

const COL_TEAMS = environment.collection.TEAMS;

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);

  /* --------------------------- Read ---------------------------*/
  public async getTeamById(teamId: string): Promise<Doc<Team>> {
    return await this.documentService.getDocumentById<Team>(COL_TEAMS, teamId, teamConverter);
  }

  //! [INDEX]
  public async getActiveTeamsByUserId(userId: string): Promise<Doc<Team>[]> {
    const valueConstraints = [
      where('userIds', 'array-contains', userId),
      where('eventStartDate', '>=', dateYesterday())
    ];
    return this.documentService.getDocumentsWithConstraints<Team>(COL_TEAMS, valueConstraints, teamConverter);
  }

  public async getActiveTeamsByEventId(eventId: string): Promise<Doc<Team>[]> {
    const valueConstraints = [where('eventId', '==', eventId)];
    const orderConstraints = [orderBy('name', 'asc')];
    return await this.documentService.getDocumentsWithConstraints<Team>(
      COL_TEAMS,
      [...valueConstraints, ...orderConstraints],
      teamConverter
    );
  }

  public async getActiveTeamByUserIdAndEventId(userId: string, eventId: string): Promise<Doc<Team> | null> {
    const valueConstraints = [where('eventId', '==', eventId), where('userIds', 'array-contains', userId)];
    return await this.documentService.getDocumentWithConstraints<Team>(COL_TEAMS, valueConstraints, teamConverter);
  }

  public async getTeamByCode(code: string): Promise<Doc<Team> | null> {
    const valueConstraints = [where('code', '==', code)];
    return await this.documentService.getDocumentWithConstraints<Team>(COL_TEAMS, valueConstraints, teamConverter);
  }

  public async getUsersCountByEventId(eventId: string): Promise<number> {
    const valueConstraints = [where('eventId', '==', eventId)];
    return this.documentService.getDocumentCountWithConstraints<Team>(COL_TEAMS, valueConstraints, teamConverter);
  }

  public subscribeFirstTeam(userId: string, onUpdate: (documents: Doc<Team> | null) => void): () => void {
    const limitConstraints = [limit(1)];
    const valueConstraints = [
      where('userIds', 'array-contains', userId),
      where('eventStartDate', '>=', dateYesterday())
    ];
    return this.documentService.subscribeToDocumentWithConstraints<Team>(
      COL_TEAMS,
      [...limitConstraints, ...valueConstraints],
      teamConverter,
      onUpdate
    );
  }

  /* --------------------------- Create ---------------------------*/
  public async add(
    user: Doc<User>,
    eventId: string,
    eventStartDate: Date,
    teamName: string
  ): Promise<Doc<Team> | undefined> {
    /* Check nome univoco */
    const valueConstraints = [where('eventId', '==', eventId), where('name', '==', teamName)];
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
      name: teamName,
      code,
      status: TeamStatus.ACTIVE,
      bonusPoints: 0,
      totalPoints: 0,
      eventId,
      eventStartDate,
      userIds: [user.id],
      users: [
        {
          id: user.id,
          userName: user.props.userName,
          imageUrl: user.props.imageUrl,
          registeredAt: user.props.registeredAt ? new Date(user.props.registeredAt) : undefined,
          challenges: []
        }
      ],
      isActive: true,
      updatedAt: new Date()
    };
    const docRef = await this.documentService.addDocument<Team>(COL_TEAMS, props);

    /* Restituisco l'oggetto appena creato */
    return { id: docRef.id, props };
  }

  /* --------------------------- Update ---------------------------*/
  public async updateProps(teamIds: string[], data: Partial<Team>): Promise<void> {
    await this.documentService.updateDocuments<Team>(teamIds, COL_TEAMS, data);
  }

  public async updateUserPoints(team: Doc<Team>, userId: string, challengeId: string, points: number): Promise<void> {
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
    await this.documentService.updateDocuments<Team>([team.id], COL_TEAMS, team.props);
  }

  public async updateNewUser(team: Doc<Team>, user: Doc<User>): Promise<void> {
    team.props.userIds = [...team.props.userIds, user.id];
    team.props.users = [
      ...team.props.users,
      {
        id: user.id,
        userName: user.props.userName,
        imageUrl: user.props.imageUrl,
        registeredAt: user.props.registeredAt,
        challenges: []
      }
    ];
    await this.documentService.updateDocuments<Team>([team.id], COL_TEAMS, team.props);
  }

  public async updateExistingUser(
    teams: Doc<Team>[],
    userId: string,
    updates: { userName: string; imageUrl: string | null }
  ): Promise<void> {
    const updatePromises = teams.reduce<Promise<void>[]>((acc, team) => {
      const user = team.props.users.find((existingUser) => existingUser.id === userId);
      if (!user) return acc;
      user.userName = updates.userName;
      user.imageUrl = updates.imageUrl;
      acc.push(this.documentService.updateDocuments<Team>([team.id], COL_TEAMS, team.props));
      return acc;
    }, []);
    await Promise.all(updatePromises);
  }

  /* --------------------------- Delete ---------------------------*/
  public async softDelete(teamIds: string[]): Promise<void> {
    await this.documentService.updateDocuments<Team>(teamIds, COL_TEAMS, { isActive: false });
  }

  public async deleteFromTeam(team: Doc<Team>, userId: string): Promise<Doc<Team>> {
    team.props.userIds = team.props.userIds.filter((x) => x !== userId);
    team.props.users = team.props.users.filter((x) => x.id !== userId);
    await this.documentService.updateDocuments<Team>([team.id], COL_TEAMS, team.props);
    return team;
  }
}
