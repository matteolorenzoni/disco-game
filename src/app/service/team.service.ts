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
  public async getTeamById(teamId: string) {
    return await this.documentService.getDocumentById<Team>(this.COLLECTION, teamId, teamConverter);
  }

  public async getTeams(): Promise<Doc<Team>[]> {
    return await this.documentService.getAllDocuments<Team>(this.COLLECTION, teamConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addTeam(userId: string, eventId: string, form: NewTeamModel): Promise<void> {
    /* Generazione un codice univoco */
    const teamsDocs = await this.getTeams();
    const codes = teamsDocs.map((user) => user.props.code);
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
    this.logService.addLogConfirm('Squadra creata correttamente');
  }

  /* --------------------------- Update ---------------------------*/
  public async updateTeam(teamId: string, form: NewTeamModel): Promise<void> {
    await this.documentService.updateDocument<Team>(teamId, this.COLLECTION, {
      ...form,
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Squadra aggiornata correttamente');
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
