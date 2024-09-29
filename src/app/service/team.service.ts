import { Injectable, inject } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment.development';
import { LogService } from './log.service';
import { NewTeamModel } from '../model/form.model';
import { Team, TeamStatus } from '../model/team.model';
import { Doc } from '../model/firebase.model';
import { teamConverter } from '../model/converter.model';
import { UserService } from './user.service';
import { UserGameService } from './user-game.service';

const COL_TEAMS = environment.collection.TEAMS;
const COL_USERS = environment.collection.USERS;

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly userService = inject(UserService);
  readonly userGameService = inject(UserGameService);
  readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  public async getTeamById(teamId: string): Promise<Doc<Team>> {
    return await this.documentService.getDocumentById<Team>(COL_TEAMS, teamId, teamConverter);
  }

  public async getTeamByCode(code: string): Promise<Doc<Team> | undefined> {
    const teams = await this.documentService.getDocumentsByProp<Team>(COL_TEAMS, { code }, teamConverter);
    return teams[0];
  }

  public async getTeamsByEvent(eventId: string): Promise<Doc<Team>[]> {
    return await this.documentService.getDocumentsByProp<Team>(COL_TEAMS, { eventId }, teamConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addTeam(userId: string, eventId: string, form: NewTeamModel): Promise<void> {
    /* Controllo se nome è univoco */
    const teamsDocs = await this.getTeamsByEvent(eventId);
    const { names, codes } = teamsDocs.reduce(
      (acc, cur) => ({
        names: [...acc.names, cur.props.name.toLowerCase()],
        codes: [...acc.codes, cur.props.code]
      }),
      { names: [] as string[], codes: [] as string[] }
    );
    if (names.includes(form.name.toLowerCase())) {
      throw new Error('teamNameNotAvailable', { cause: 'teamNameNotAvailable' });
    }

    /* Generazione un codice univoco */
    if (codes.length > 2_000_000) {
      throw new Error('tooManyTeams', { cause: 'tooManyTeams' });
    }
    let code = this.generateRandomCode(6);
    while (codes.includes(code)) {
      code = this.generateRandomCode(6);
    }

    /* Aggiungo evento al DB */
    const teamRef = await this.documentService.addDocument<Team>(COL_TEAMS, {
      ...form,
      userId,
      eventId,
      description: '',
      code,
      status: TeamStatus.ACTIVE,
      members: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    /* Aggiungo UserGame al DB */
    const userGameRef = await this.userGameService.addUserGame(userId, eventId, teamRef.id);

    /* Aggiorno User (prop: games) */
    await this.userService.updateUserGames(userId, userGameRef.id);

    /* Aggiorno Team (prop: members) */
    await this.updateTeamMembers(teamRef.id, userId);

    /* Log */
    navigator.clipboard.writeText(code);
    this.logService.addLogConfirm(`Squadra creata! Codice: ${code} (copiato negli appunti)`);
  }

  /* --------------------------- Update ---------------------------*/
  public async updateTeam(teamId: string, form: NewTeamModel): Promise<void> {
    await this.documentService.updateDocument<Team>(teamId, COL_TEAMS, {
      ...form,
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Squadra aggiornata correttamente');
  }

  public async updateTeamMembers(teamId: string, userId: string): Promise<void> {
    await this.documentService.updateArrayPropReference<Team>(
      'add',
      'members',
      `${COL_TEAMS}/${teamId}`,
      `${COL_USERS}/${userId}`
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
