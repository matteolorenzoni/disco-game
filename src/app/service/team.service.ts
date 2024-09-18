import { inject, Injectable } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment.development';
import { Team, TeamStatus } from '../model/team.model';
import { TeamModel } from '../model/form.model';
import { teamConverter } from '../model/converter.model';
import { LogService } from './log.service';

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

  /* --------------------------- Create ---------------------------*/
  public async addTeam(userId: string, defaultCode: string, eventId: string, form: TeamModel): Promise<void> {
    await this.documentService.addDocument<Team>(this.COLLECTION, {
      ...form,
      userId,
      eventId,
      defaultCode,
      status: TeamStatus.ACTIVE,
      memberIds: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Squadra aggiunta correttamente');
  }

  /* --------------------------- Update ---------------------------*/
  public async updateTeam(teamId: string, form: TeamModel): Promise<void> {
    await this.documentService.updateDocument<Team>(teamId, this.COLLECTION, {
      ...form,
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Squadra aggiornata correttamente');
  }
}
