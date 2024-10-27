import { Injectable, inject } from '@angular/core';
import { FirebaseDocumentService } from './firebase-document.service';
import { environment } from '../../environments/environment';
import { Team } from '../model/team.model';
import { Doc } from '../model/firebase';
import { teamConverter } from '../model/converter';
import { HttpService } from './http.service';
import { limit, orderBy, where } from 'firebase/firestore';

const COL_TEAMS = environment.collection.TEAMS;

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);
  private readonly httpService = inject(HttpService);

  /* --------------------------- Read ---------------------------*/
  public async getActiveTeamsByEventId(eventId: string): Promise<Doc<Team>[]> {
    return await this.httpService.execute(async () => {
      const valueConstraints = [where('eventId', '==', eventId)];
      const orderConstraints = [orderBy('totalPoints', 'desc'), orderBy('name')];
      return await this.documentService.getDocumentsWithConstraints<Team>(
        COL_TEAMS,
        [...valueConstraints, ...orderConstraints],
        teamConverter
      );
    });
  }

  public subscribeToActiveTeamsByEventIdTop10(eventId: string, onUpdate: (documents: Doc<Team>[]) => void): () => void {
    const valueConstraints = [where('eventId', '==', eventId)];
    const orderConstraints = [orderBy('totalPoints', 'desc'), orderBy('name')];
    const limitConstraints = [limit(2)];
    return this.documentService.subscribeToDocumentsWithConstraints<Team>(
      COL_TEAMS,
      [...valueConstraints, ...orderConstraints, ...limitConstraints],
      teamConverter,
      onUpdate
    );
  }
}
