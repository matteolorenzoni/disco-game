import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendar, faClipboard, faCrown, faLocationPin, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Doc } from '../../../model/firebase';
import { Event } from '../../../model/event.model';
import { Team } from '../../../model/team.model';
import { EventService } from '../../../service/event.service';
import { FirebaseService } from '../../../service/firebase.service';
import { TeamService } from '../../../service/team.service';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { TitleComponent } from '../../../components/title/title.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { FvCountdownComponent } from '../../../components/fv-countdown.component';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { LogService } from './../../../service/log.service';
import { FvChallengeStatusComponent } from '../../../components/fv-challenge-status.component';
import { IndexedDbService } from '../../../service/indexed-db.service';
import { LocalStorageService } from '../../../service/local-storage.service';
import { MergeChallenge, mergeChallenges } from '../../../util/merge.util';
import { UserService } from '../../../service/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TitleComponent,
    FvButtonComponent,
    FvCountdownComponent,
    FvRatingComponent,
    FvChallengeStatusComponent,
    FaIconComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly userService = inject(UserService);
  readonly eventService = inject(EventService);
  readonly teamService = inject(TeamService);
  readonly eventChallengeService = inject(EventChallengeService);
  readonly challengeService = inject(ChallengeService);
  readonly lsService = inject(LocalStorageService);
  readonly dbService = inject(IndexedDbService);
  readonly logService = inject(LogService);

  /* Variables */
  event = signal<Doc<Event> | undefined>(undefined);
  team = signal<Doc<Team> | null | undefined>(undefined);
  mergedChallenges = signal<MergeChallenge[]>([]);

  /* Constants */
  NOW = new Date();

  /* Icons */
  ICON_CALENDAR = faCalendar;
  ICON_PLACE = faLocationPin;
  ICON_CROWN = faCrown;
  ICON_CLIPBOARD = faClipboard;
  ICON_TRASH = faTrash;

  /* -------------------------- Lifecycle hooks --------------------------  */
  async ngOnInit(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    if (!userId) throw new Error('retry', { cause: 'retry' });

    /* Inizializzazione indexedDB */
    await this.initIndexedDb();

    /* Inizializzazione http */
    await this.initHttp(userId);
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initIndexedDb() {
    // Recupera l'ID del team dall'archiviazione locale, se non è presente termina l'operazione
    const lsTeamId = this.lsService.getUserDashboardTeamId();
    if (!lsTeamId) {
      this.resetDashboard();
      return;
    }

    // Imposta il team corrispondente all'ID salvato in Local Storage
    const dbTeams = await this.dbService.getTeams();
    const team = dbTeams.find((x) => x.id === lsTeamId);
    this.team.set(team ?? null);
    if (!team) return;

    // Imposta l'evento associato al team corrente
    const dbEvents = await this.dbService.getEvents();
    const event = dbEvents.find((x) => x.id === team.props.eventId);
    this.event.set(event);
    if (!event) return;

    // Filtra e imposta nello stato le sfide dell'evento corrente.
    const dbMergedChallenges = await this.dbService.getChallenges();
    const mergedChallenges = dbMergedChallenges.filter((x) => x.eventId === event.id);
    this.mergedChallenges.set(mergedChallenges);
  }

  private async initHttp(userId: string) {
    // Recupera le informazioni della partecipazione piu recente
    const team = await this.teamService.getFirstActiveTeamByUserId(userId);

    // Se non è stato trovato alcun utente associato al team, termina l'operazione
    this.team.set(team);
    if (!team) {
      await this.resetLocalStorageAndIndexedDB();
      return;
    }

    // Recupera l'evento e le sfide associate all'evento in parallelo
    const [event, eventChallenges] = await Promise.all([
      this.eventService.getEventById(team.props.eventId),
      this.eventChallengeService.getEventChallengesByProp([{ key: 'eventId', value: team.props.eventId }])
    ]);
    this.event.set(event);

    // Recupera le informazioni dettagliate sulle sfide
    const challenges = await this.challengeService.getChallengesByIds(eventChallenges.map((x) => x.props.challengeId));
    const mergedChallenges = mergeChallenges(challenges, eventChallenges);
    this.mergedChallenges.set(mergedChallenges);

    /* Aggiorno il local storage indexedDB */
    this.lsService.setUserDashboardTeamId(team.id);
    this.dbService.saveTeams([team]);
    this.dbService.saveEvents([event]);
    this.dbService.saveChallenges(mergedChallenges);
  }

  /* -------------------------- Methods firebase --------------------------  */
  protected async escapeToTeam(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    const event = this.event();
    const team = this.team();
    if (!userId || !event || !team) throw new Error('retry', { cause: 'retry' });

    const userConfirm = confirm('Sei sicuro di voler uscire dalla squadra?');
    if (!userConfirm) return;

    /* Rimuovi da User (prop: eventIds e teamIds) */
    await this.userService.updateEventsAndTeams('REMOVE', userId, event.id, team.id);

    /* Rimuovi da squadra */
    const teamUpdated = await this.teamService.deleteFromTeam(team, userId);

    /* Rimuovi squadra e aggiorna evento se non ha piu nessun membro */
    if (teamUpdated.props.userIds.length <= 0) {
      await this.teamService.deleteTeam(team.id);
      await this.eventService.updateTeams('REMOVE', event.id, team.id);
    }

    /* Rimuovi da local storage e indexedDb */
    await this.resetLocalStorageAndIndexedDB();

    /* Log */
    this.logService.addLogConfirm('Non fai piu parte della squadra');
  }

  /* -------------------------- Methods event--------------------------  */
  protected async onGoToTeam(): Promise<void> {
    const team = this.team();
    if (!team) throw new Error('retry', { cause: 'retry' });
    await this.router.navigate([`user/events/${team.props.eventId}/${team.id}`]);
  }

  protected async onGoToChallenge(challengeId: string): Promise<void> {
    const team = this.team();
    if (!team) throw new Error('retry', { cause: 'retry' });
    await this.router.navigate([`user/challenges/${team.props.eventId}/${team.id}/${challengeId}`]);
  }

  protected onCopyCodeToClipboard(): void {
    const team = this.team();
    if (!team) throw new Error('retry', { cause: 'retry' });
    if (!navigator) return;

    /* Log e clipboard */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(team.props.code);
      this.logService.addLogConfirm('Codice copiato negli appunti');
    }
  }

  /* -------------------------- Methods utils --------------------------  */
  private async resetDashboard() {
    this.event.set(undefined);
    this.team.set(null);
    this.mergedChallenges.set([]);
  }

  private async resetLocalStorageAndIndexedDB() {
    const teamId = this.lsService.getUserDashboardTeamId();
    if (!teamId) return;

    this.lsService.removeUserDashboardTeamId();
    await this.dbService.deleteTeams([teamId]);
    await this.initIndexedDb();
  }
}
