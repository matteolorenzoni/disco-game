/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { EventService } from '../../../service/event.service';
import { FirebaseService } from '../../../service/firebase.service';
import { LogService } from '../../../service/log.service';
import { TeamService } from '../../../service/team.service';
import { UserService } from '../../../service/user.service';
import { FvFieldIconComponent } from '../../../components/fv-field-icon.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { TitleComponent } from '../../../components/title/title.component';
import { FvButtonOutlinedComponent } from '../../../components/fv-button-outlined.component';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { LocalStorageService } from '../../../service/local-storage.service';
import { IndexedDbService } from '../../../service/indexed-db.service';
import { MergeEvent, mergeEvents } from '../../../util/merge.util';
import { Team } from '../../../model/team.model';
import { Doc } from '../../../model/firebase';

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
  private readonly router = inject(Router);
  private readonly firebaseService = inject(FirebaseService);
  private readonly userService = inject(UserService);
  private readonly eventService = inject(EventService);
  private readonly teamService = inject(TeamService);
  private readonly lsService = inject(LocalStorageService);
  private readonly dbService = inject(IndexedDbService);
  private readonly logService = inject(LogService);

  /* Variables */
  mergedEvents = signal<MergeEvent[] | undefined>(undefined);
  teams = signal<Doc<Team>[]>([]);

  /* Icons */
  ICON_TRASH = faTrash;

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
    const teams = await this.dbService.getTeams();
    this.teams.set(teams);

    const events = await this.dbService.getEvents();
    const mergedEvents = mergeEvents(events, teams);
    this.mergedEvents.set(mergedEvents);
  }

  private async initHttp(userId: string) {
    const [events, teams] = await Promise.all([
      this.eventService.getActiveEvents(), // eventi da ieri in poi
      this.teamService.getActiveTeamsByUserId(userId) // partecipazioni di eventi da ieri in poi
    ]);

    /* Memorizzo le squadre */
    this.teams.set(teams);

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
      this.logService.addLogErrorApp('Nome già esistente, sceglierne uno nuovo');
      return;
    }

    /* Aggiungo partecipazione */
    await this.addParticipation(event.id, team.id, user.id);

    /* Log e clipboard */
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(team.props.code);
      this.logService.addLogConfirm(`Squadra creata. Codice [${team.props.code}] copiato negli appunti`);
    } else {
      this.logService.addLogConfirm(`Squadra creata`);
    }
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
      this.logService.addLogErrorApp('Nessuna squadra trovata');
      return;
    }

    /* Aggiungo user al team */
    await this.teamService.updateUsers(team, user);

    /* Aggiungo partecipazione */
    await this.addParticipation(eventId, team.id, user.id);

    /* Log */
    this.logService.addLogConfirm('Ora fai parte della squadra, buona fortuna');
  }

  protected async onEscapeToTeam(eventId: string, teamId: string): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    const team = this.teams().find((x) => x.id === teamId);
    if (!userId || !team) throw new Error('retry', { cause: 'retry' });

    const userConfirm = confirm('Sei sicuro di voler uscire dalla squadra?');
    if (!userConfirm) return;

    /* Rimuovi da User (prop: eventIds e teamIds) */
    await this.userService.updateEventsAndTeams('REMOVE', userId, eventId, team.id);

    /* Rimuovi da squadra */
    const teamUpdated = await this.teamService.deleteFromTeam(team, userId);

    /* Rimuovi squadra e aggiorna evento se non ha piu nessun membro */
    if (teamUpdated.props.userIds.length <= 0) {
      await this.teamService.deleteTeam(team.id);
      await this.eventService.updateTeams('REMOVE', eventId, team.id);
    }

    /* Rimuovi da indexedDb */
    this.lsService.removeUserDashboardTeamId();
    await this.dbService.deleteTeams([team.id]);
    await this.initIndexedDb();

    /* Log */
    this.logService.addLogConfirm('Non fai piu parte della squadra');
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
