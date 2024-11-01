/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCrown, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { EventService } from '../../../service/event.service';
import { FirebaseService } from '../../../service/firebase.service';
import { LogService } from '../../../service/log.service';
import { TeamService } from '../../../service/team.service';
import { UserService } from '../../../service/user.service';
import { FvFieldIconComponent } from '../../../components/fv-field-icon.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { TitleComponent } from '../../../components/title/title.component';
import { FvButtonOutlinedComponent } from '../../../components/fv-button-outlined.component';
import { ChallengeService } from '../../../service/challenge.service';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { LocalStorageService } from '../../../service/local-storage.service';
import { IndexedDbService } from '../../../service/indexed-db.service';
import { MergeEvent, mergeEvents } from '../../../util/merge.util';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    TitleComponent,
    FvFieldIconComponent,
    FvButtonComponent,
    FvButtonOutlinedComponent,
    FvRatingComponent
  ],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly userService = inject(UserService);
  readonly eventService = inject(EventService);
  readonly teamService = inject(TeamService);
  readonly challengeService = inject(ChallengeService);
  readonly lsService = inject(LocalStorageService);
  readonly dbService = inject(IndexedDbService);
  readonly logService = inject(LogService);

  /* Variables */
  mergedEvents = signal<MergeEvent[] | undefined>(undefined);

  /* Icons */
  ICON_CROWN = faCrown;
  ICON_TEAM = faPeopleGroup;

  /* -------------------- Lifecycle hooks -------------------- */
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
    const events = await this.dbService.getEvents();
    const teams = await this.dbService.getTeams();
    const mergedEvents = mergeEvents(events, teams);
    this.mergedEvents.set(mergedEvents);
  }

  private async initHttp(userId: string) {
    /* Ottengo gli eventi da ieri/oggi in poi */
    /* Ottengo le varie partecipazioni dell'utente */
    const [events, teams] = await Promise.all([
      this.eventService.getActiveEvents(),
      this.teamService.getActiveTeamsByUserId(userId)
    ]);

    /* Metto insieme i dati */
    const mergedEvents = mergeEvents(events, teams);
    this.mergedEvents.set(mergedEvents);

    /* Aggiorno il indexedDB */
    this.dbService.saveEvents(events);
    this.dbService.saveTeams(teams);
  }

  /* -------------------- Methods: firebase -------------------- */
  protected async addTeam(eventId: string): Promise<void> {
    const user = this.lsService.getUser();
    const event = this.mergedEvents()!.find((x) => x.id === eventId);
    if (!user || !event) throw new Error('retry', { cause: 'retry' });

    /* Ottengo il nome dal prompt */
    const teamName = prompt('Inserisci il nome della tua squadra');
    if (!teamName) return;

    /* Aggiungo Team al DB */
    const team = await this.teamService.addTeam(user, event.id, event.startDate, teamName);
    if (!team) {
      const msg = 'Nome già esistente, sceglierne uno nuovo';
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, msg);
      return;
    }

    /* Aggiungo partecipazione */
    await this.addParticipation(event.id, team.id, user.id);

    /* Log */
    navigator.clipboard.writeText(team.props.code);
    this.logService.addLogConfirm(`Squadra creata! Codice ${team.props.code} negli appunti`);
  }

  protected async findTeam(eventId: string): Promise<void> {
    const user = this.lsService.getUser();
    if (!user) throw new Error('retry', { cause: 'retry' });

    /* Ottengo il codice dal prompt */
    const teamCode = prompt('Inserisci il codice della tua squadra');
    if (!teamCode) return;

    /* Controllo se esiste una squadra con quel codice */
    const team = await this.teamService.getTeamByCode(teamCode);
    if (!team) {
      this.logService.addLogError(user.id, 'Nessuna squadra trovata');
      return;
    }

    /* Aggiungo user al team */
    await this.teamService.updateUsers(team, user);

    /* Aggiungo partecipazione */
    await this.addParticipation(eventId, team.id, user.id);

    /* Log */
    this.logService.addLogConfirm('Ora fai parte della squadra, buona fortuna');
  }

  /* -------------------- Methods: on event -------------------- */
  protected async onGoToTeam(eventId: string, teamId: string): Promise<void> {
    await this.router.navigate([`user/events/${eventId}/${teamId}`]);
  }

  /* -------------------- Methods: utils -------------------- */
  private async addParticipation(eventId: string, teamId: string, userId: string): Promise<void> {
    /* Aggiorno User (prop: eventIds e teamIds) */
    await this.userService.updateEventsAndTeams('ADD', userId, eventId, teamId);

    /* Aggiorno Event (prop: teamIds) */
    await this.eventService.updateTeams('ADD', eventId, teamId);

    /* Aggiorno lista e indexedDb */
    const newTeam = await this.teamService.getTeamById(teamId);
    this.dbService.saveTeams([newTeam]);
    this.initIndexedDb();
  }
}
