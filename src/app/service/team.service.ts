import { Injectable, inject } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { LogService } from './log.service';
import { NewTeamModel } from '../model/form.model';
import { Team, TeamStatus } from '../model/team.model';
import { Doc } from '../model/firebase';
import { teamConverter } from '../model/converter';
import { EventTeamUserService } from './event-team-user.service';
import { HttpService } from './http.service';

const COL_TEAMS = environment.collection.TEAMS;
const COL_EVENT_TEAM_USERS = environment.collection.EVENT_TEAM_USERS;

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);
  readonly eventTeamUserService = inject(EventTeamUserService);
  readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  public async getTeamById(teamId: string): Promise<Doc<Team>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentById<Team>(COL_TEAMS, teamId, teamConverter);
    });
  }

  public async getTeamByCode(code: string): Promise<Doc<Team> | undefined> {
    return await this.httpService.execute(async () => {
      const teams = await this.documentService.getActiveDocumentsByProp<Team>(COL_TEAMS, { code }, teamConverter);
      return teams[0];
    });
  }

  public async getTeamsByEvent(eventId: string): Promise<Doc<Team>[]> {
    return await this.httpService.execute(async () => {
      const eventTeamUsers = await this.eventTeamUserService.getEventTeamUsersByProp([
        { key: 'eventId', value: eventId }
      ]);
      const teamIds = eventTeamUsers.map((x) => x.props.teamId);
      return await Promise.all(teamIds.map((x) => this.getTeamById(x)));
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addTeam(
    userId: string,
    eventId: string,
    teamForm: NewTeamModel
  ): Promise<{ teamId: string; teamCode: string }> {
    return await this.httpService.execute(async () => {
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
        totalPoints: 0,
        currentPosition: 0,
        lastPosition: 0,
        eventTeamUserRefs: [],
        isActive: true,
        updatedAt: new Date()
      });

      return { teamId: teamRef.id, teamCode: code };
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async updateTeam(teamId: string, form: NewTeamModel): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateDocument<Team>(teamId, COL_TEAMS, form);
      this.logService.addLogConfirm('Squadra aggiornata');
    });
  }

  public async updateEventTeamUser(eventId: string, eventTeamUserId: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateArrayPropReference<Team>(
        'add',
        'eventTeamUserRefs',
        `${COL_TEAMS}/${eventId}`,
        `${COL_EVENT_TEAM_USERS}/${eventTeamUserId}`
      );
    });
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
