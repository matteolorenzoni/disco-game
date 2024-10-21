import { Injectable, inject } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { NewTeamModel } from '../model/form.model';
import { Team, TeamStatus } from '../model/team.model';
import { Doc } from '../model/firebase';
import { eventTeamUserConverter, teamConverter } from '../model/converter';
import { EventTeamUserService } from './event-team-user.service';
import { HttpService } from './http.service';
import { generateUniqueCode } from '../util/utils';
import { EventTeamUser } from '../model/event-team-user.model';

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

  public async getTeamsByName(name: string): Promise<Doc<Team>[]> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentsByProps<Team>(COL_TEAMS, { name, isActive: true }, teamConverter);
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
      /* Check nome univoco */
      const teams = await this.getTeamsByName(teamForm.name);
      const eventTeamUsers = await this.documentService.getDocumentsByIds<EventTeamUser>(
        COL_EVENT_TEAM_USERS,
        teams.map((x) => x.id),
        eventTeamUserConverter
      );
      if (eventTeamUsers.length > 0) throw new Error('teamNameNotAvailable', { cause: 'teamNameNotAvailable' });

      /* Check codice univoco */
      const code = await generateUniqueCode(6, 100, this.getTeamByCode.bind(this));

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
