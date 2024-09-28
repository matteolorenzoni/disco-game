import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment.development';
import { Team, TeamStatus } from '../model/team.model';
import { NewTeamModel } from '../model/form.model';
import { teamConverter } from '../model/converter.model';
import { LogService } from './log.service';
import { Doc } from '../model/firebase.model';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  /* Services */
  readonly documentService = inject(FirebaseDocumentService);
  readonly logService = inject(LogService);

  /* Constants */
  COLLECTION = environment.collection.TEAMS;

  /* --------------------------- Read ---------------------------*/
  public async getTeamById(teamId: string): Promise<Doc<Team>> {
    return await this.documentService.getDocumentById<Team>(this.COLLECTION, teamId, teamConverter);
  }

  public async getTeamByCode(code: string): Promise<Doc<Team> | undefined> {
    const teams = await this.documentService.getDocumentsByProp<Team>(this.COLLECTION, { code }, teamConverter);
    return teams[0];
  }

  public async getTeamsByEvent(eventId: string): Promise<Doc<Team>[]> {
    return await this.documentService.getDocumentsByProp<Team>(this.COLLECTION, { eventId }, teamConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addTeam(userId: string, eventId: string, form: NewTeamModel): Promise<void> {
    /* Generazione un codice univoco */
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

    if (codes.length > 2_000_000) {
      throw new Error('tooManyTeams', { cause: 'tooManyTeams' });
    }

    let code = this.generateRandomCode(6);
    while (codes.includes(code)) {
      code = this.generateRandomCode(6);
    }

    await this.documentService.addDocument<Team>(this.COLLECTION, {
      ...form,
      userId,
      eventId,
      description: '',
      code,
      status: TeamStatus.ACTIVE,
      memberIds: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    navigator.clipboard.writeText(code);
    this.logService.addLogConfirm(`Squadra creata! Codice: ${code} (copiato negli appunti)`);
  }

  /* --------------------------- Update ---------------------------*/
  public async updateTeam(teamId: string, form: NewTeamModel): Promise<void> {
    await this.documentService.updateDocument<Team>(teamId, this.COLLECTION, {
      ...form,
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Squadra aggiornata correttamente');
  }

  public async addTeamMember(teamId: string, memberId: string): Promise<void> {
    await this.documentService.updateArrayProp<Team>('add', teamId, this.COLLECTION, 'memberIds', memberId);
    this.logService.addLogConfirm('Sei stato aggiunto alla squadra con successo!');
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
