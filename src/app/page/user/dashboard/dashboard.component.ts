import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faAngleRight,
  faArrowUpFromBracket,
  faCalendar,
  faCrown,
  faLocationPin,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { Doc } from '../../../model/firebase';
import { Event } from '../../../model/event.model';
import { Team, TeamStatus } from '../../../model/team.model';
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
import { LoaderService } from '../../../service/loader.service';
import { shareTeamCode } from '../../../util/utils';

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
export class DashboardComponent implements OnInit, OnDestroy {
  /* Services */
  private readonly router = inject(Router);
  protected readonly firebaseService = inject(FirebaseService);
  private readonly userService = inject(UserService);
  private readonly eventService = inject(EventService);
  private readonly teamService = inject(TeamService);
  private readonly eventChallengeService = inject(EventChallengeService);
  private readonly challengeService = inject(ChallengeService);
  private readonly lsService = inject(LocalStorageService);
  private readonly dbService = inject(IndexedDbService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Variables */
  event = signal<Doc<Event> | undefined>(undefined);
  team = signal<Doc<Team> | null | undefined>(undefined);
  mergedChallenges = signal<MergeChallenge[]>([]);

  /* Constants */
  NOW = new Date();

  /* Enum */
  TEAM_STATUS = TeamStatus;

  /* Ref */
  teamUnsubscribe?: () => void;
  eventChallengeUnsubscribe?: () => void;

  /* Icons */
  ICON_CALENDAR = faCalendar;
  ICON_PLACE = faLocationPin;
  ICON_CROWN = faCrown;
  ICON_SHARE = faArrowUpFromBracket;
  ICON_TRASH = faTrash;
  ICON_RIGHT = faAngleRight;

  /* -------------------------- Lifecycle hooks --------------------------  */
  async ngOnInit(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    if (!userId) throw new Error('retry', { cause: 'retry' });

    /* Inizializzazione indexedDB */
    await this.initIndexedDb();

    /* Inizializzazione http */
    await this.initHttp(userId);
  }

  ngOnDestroy(): void {
    if (this.teamUnsubscribe) this.teamUnsubscribe();
    if (this.eventChallengeUnsubscribe) this.eventChallengeUnsubscribe();
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
    let teamId: string | null = null;

    // Rimane in ascolto sulla squadra
    if (this.teamUnsubscribe) this.teamUnsubscribe();
    this.teamUnsubscribe = this.teamService.subscribeFirstTeam(userId, async (team) => {
      // Se non è stato trovato alcun utente associato al team, termina l'operazione
      if (!team) {
        await this.resetLocalStorageAndIndexedDB();
        return;
      }
      this.team.set(team);
      this.lsService.setUserDashboardTeamId(team.id);
      this.dbService.saveTeams([team]);

      /* Proseguo solo se cambia squadra dalla volta precedente (in teoria solo la 1° volta) */
      if (teamId === team.id) return;
      teamId = team.id;

      // Recupera l'evento
      const event = await this.eventService.getEventById(team.props.eventId);
      this.event.set(event);
      this.dbService.saveEvents([event]);

      // Rimane in ascolto sulle sfide associate all'evento
      if (this.eventChallengeUnsubscribe) this.eventChallengeUnsubscribe();
      this.eventChallengeUnsubscribe = this.eventChallengeService.subscribeEventChallengesByProp(
        [{ key: 'eventId', value: team.props.eventId }],
        async (eventChallenges) => {
          // Recupera le informazioni dettagliate sulle sfide
          const challengeIds = eventChallenges.map((x) => x.props.challengeId);
          const challenges = await this.challengeService.getChallengesByIds(challengeIds);
          const mergedChallenges = mergeChallenges(challenges, eventChallenges);
          this.mergedChallenges.set(mergedChallenges);
          this.dbService.saveChallenges(mergedChallenges);
        }
      );
    });
  }

  /* -------------------------- Methods firebase --------------------------  */
  protected async deleteTeam(eventStartDate: Date): Promise<void> {
    const userConfirm = confirm('Sei sicuro di voler uscire dalla squadra?');
    if (!userConfirm) return;

    if (eventStartDate.getTime() < new Date().getTime()) {
      this.logService.addLogErrorApp('Operazione non più possibile, evento iniziato');
      return;
    }

    this.loaderService.executeImmediate(async () => {
      const userId = this.firebaseService.userFirebase()?.uid;
      const event = this.event();
      const team = this.team();
      if (!userId || !event || !team) throw new Error('retry', { cause: 'retry' });

      /* Elimino da squadra */
      const teamUpdated = await this.teamService.deleteFromTeam(team, userId);

      /* Elimino squadra (se non ha più nessun membro) */
      if (teamUpdated.props.userIds.length <= 0) {
        await this.teamService.softDelete([team.id]);
        await this.eventService.updateTeams('REMOVE', event.id, team.id);
      }

      /* Elimino partecipazione dall'utente */
      await this.userService.updateParticipations('REMOVE', userId, event.id, team.id);

      /* Aggiorno local storage e indexedDb */
      await this.resetLocalStorageAndIndexedDB();

      /* Fermo ascolti sui documenti */
      if (this.teamUnsubscribe) this.teamUnsubscribe();
      if (this.eventChallengeUnsubscribe) this.eventChallengeUnsubscribe();

      /* Log */
      this.logService.addLogConfirm('Non fai più parte della squadra');
    });
  }

  /* -------------------------- Methods event--------------------------  */
  protected async onGoToTeam(): Promise<void> {
    const team = this.team();
    if (!team) throw new Error('retry', { cause: 'retry' });
    await this.router.navigate([`user/events/${team.props.eventId}/team/${team.id}`]);
  }

  protected async onGoToChallenge(challengeId: string): Promise<void> {
    const team = this.team();
    if (!team) throw new Error('retry', { cause: 'retry' });
    await this.router.navigate([`user/events/${team.props.eventId}/team/${team.id}/challenge/${challengeId}`]);
  }

  protected onCopyCodeToClipboard(): void {
    const team = this.team();
    if (!team) throw new Error('retry', { cause: 'retry' });
    if (!navigator) return;

    /* Condivide o copia codice squadra */
    shareTeamCode(team.props.code, this.logService);
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
