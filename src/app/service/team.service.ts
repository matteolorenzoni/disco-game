import { Injectable, inject } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment.development';
import { LogService } from './log.service';
import { NewTeamModel } from '../model/form.model';
import { Team, TeamStatus } from '../model/team.model';
import { Doc } from '../model/firebase';
import { teamConverter } from '../model/converter';
import { UserEventTeamService } from './user-event-team.service';

const COL_TEAMS = environment.collection.TEAMS;
const COL_USER_EVENT_TEAM = environment.collection.USER_EVENT_TEAMS;

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly userEventTeamService = inject(UserEventTeamService);
  readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  public async getTeamById(teamId: string): Promise<Doc<Team>> {
    return await this.documentService.getDocumentById<Team>(COL_TEAMS, teamId, teamConverter);
  }

  public async getTeamByCode(code: string): Promise<Doc<Team> | undefined> {
    const teams = await this.documentService.getActiveDocumentsByProp<Team>(COL_TEAMS, { code }, teamConverter);
    return teams[0];
  }

  // TODO: vedere se aggiungere eventId a Team
  public async getTeamsByEvent(eventId: string): Promise<Doc<Team>[]> {
    const userEventTeams = await this.userEventTeamService.getUserEventTeamByProp('eventId', eventId);
    const teamIds = userEventTeams.map((x) => x.props.teamId);
    return await Promise.all(teamIds.map((x) => this.getTeamById(x)));
  }

  /* --------------------------- Create ---------------------------*/
  public async addTeam(
    userId: string,
    eventId: string,
    teamForm: NewTeamModel
  ): Promise<{ teamId: string; teamCode: string }> {
    const teamsDocs = await this.getTeamsByEvent(eventId);
    const { names, codes } = teamsDocs.reduce(
      (acc, cur) => ({
        names: [...acc.names, cur.props.name.toLowerCase()],
        codes: [...acc.codes, cur.props.code]
      }),
      { names: [] as string[], codes: [] as string[] }
    );

    /* Check nome univoco */
    if (names.includes(teamForm.name.toLowerCase())) {
      throw new Error('teamNameNotAvailable', { cause: 'teamNameNotAvailable' });
    }

    /* Check codice univoco */
    if (codes.length > 2_000_000) {
      throw new Error('tooManyTeams', { cause: 'tooManyTeams' });
    }
    let code = this.generateRandomCode(6);
    while (codes.includes(code)) {
      code = this.generateRandomCode(6);
    }

    /* Aggiungo evento al DB */
    const teamRef = await this.documentService.addDocument<Team>(COL_TEAMS, {
      leaderId: userId,
      name: teamForm.name,
      description: '',
      code,
      status: TeamStatus.ACTIVE,
      userEventTeamRefs: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { teamId: teamRef.id, teamCode: code };
  }

  /* --------------------------- Update ---------------------------*/
  public async updateTeam(teamId: string, form: NewTeamModel): Promise<void> {
    await this.documentService.updateDocument<Team>(teamId, COL_TEAMS, {
      ...form,
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Squadra aggiornata');
  }

  public async updateUserEventTeam(eventId: string, userEventTeamId: string): Promise<void> {
    await this.documentService.updateArrayPropReference<Team>(
      'add',
      'userEventTeamRefs',
      `${COL_TEAMS}/${eventId}`,
      `${COL_USER_EVENT_TEAM}/${userEventTeamId}`
    );
  }

  /* --------------------------- Utils ---------------------------*/
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }
}
