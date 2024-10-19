import { Injectable, inject } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { NewTeamModel } from '../model/form.model';
import { Team, TeamStatus } from '../model/team.model';
import { Doc } from '../model/firebase';
import { teamConverter } from '../model/converter';
import { EventTeamUserService } from './event-team-user.service';
import { HttpService } from './http.service';
import { generateRandomCode } from '../util/utils';

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

  /* --------------------------- Read ---------------------------*/
  public async getTeamById(teamId: string): Promise<Doc<Team>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentById<Team>(COL_TEAMS, teamId, teamConverter);
    });
  }

  public async getTeamByCode(code: string): Promise<Doc<Team> | null> {
    return await this.httpService.execute(async () => {
      const teams = await this.documentService.getDocumentsByProps<Team>(
        COL_TEAMS,
        { code, isActive: true },
        teamConverter
      );
      return teams.length ? teams[0] : null;
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addTeam(userId: string, eventId: string, teamForm: NewTeamModel): Promise<Doc<Team>> {
    return await this.httpService.execute(async () => {
      /* Ottengo tutte le squadre che partecipano all'evento */
      const inEventTeams = await this.eventTeamUserService.getEventTeamUsersByProp([
        { key: 'eventId', value: eventId }
      ]);

      /* Ottengo tutte le informazioni delle squadre che partecipano all'evento */
      const teams = await this.documentService.getDocumentsByIds<Team>(
        COL_TEAMS,
        inEventTeams.map((x) => x.props.teamId),
        teamConverter
      );
      const { names, codes } = teams.reduce(
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
      let code = generateRandomCode(6);
      while (codes.includes(code)) {
        code = generateRandomCode(6);
      }

      /* Aggiungo evento al DB */
      const props = {
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
      };
      const docRef = await this.documentService.addDocument<Team>(COL_TEAMS, props);

      /* Restituisco l'oggetto appena creato */
      return { id: docRef.id, props };
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async updateTeamPoints(teamId: string, points: number): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.incrementProp<Team>(teamId, COL_TEAMS, 'totalPoints', points);
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
}
