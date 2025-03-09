/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { EventService } from '../../../service/event.service';
import { FirebaseService } from '../../../service/firebase.service';
import { LogService } from '../../../service/log.service';
import { TeamService } from '../../../service/team.service';
import { UserService } from '../../../service/user.service';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { TitleComponent } from '../../../components/title/title.component';
import { FvButtonOutlinedComponent } from '../../../components/fv-button-outlined.component';
import { LocalStorageService } from '../../../service/local-storage.service';
import { IndexedDbService } from '../../../service/indexed-db.service';
import { MergeEvent, mergeEvents } from '../../../util/merge.util';
import { Team } from '../../../model/team.model';
import { Doc } from '../../../model/firebase';
import { LoaderService } from '../../../service/loader.service';
import { User } from '../../../model/user.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FaIconComponent, TitleComponent, FvButtonComponent, FvButtonOutlinedComponent],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit {
  /* Services */
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly firebaseService = inject(FirebaseService);
  private readonly userService = inject(UserService);
  private readonly eventService = inject(EventService);
  private readonly teamService = inject(TeamService);
  private readonly lsService = inject(LocalStorageService);
  private readonly dbService = inject(IndexedDbService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Params */
  TEAM_CODE = this.route.snapshot.queryParamMap.get('teamCode');

  /* Variables */
  mergedEvents = signal<MergeEvent[] | undefined>(undefined);
  teams = signal<Doc<Team>[]>([]);

  /* Constants */
  NOW = new Date();

  /* Icons */
  ICON_TRASH = faTrash;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    /* Inizializzazione indexedDB */
    await this.initIndexedDb();

    // Cerca la squadra se è entrato con il link di invito
    await this.initTeam();

    /* Inizializzazione http */
    await this.initHttp();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initIndexedDb(): Promise<void> {
    const teams = await this.dbService.getTeams();
    this.teams.set(teams);

    const events = await this.dbService.getEvents();
    const mergedEvents = mergeEvents(events, teams);
    this.mergedEvents.set(mergedEvents);
  }

  private async initTeam(): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      const user = this.lsService.getUser();
      if (!user || !this.TEAM_CODE) return;

      /* Cerca la squadra e, se possibile, aggiunge l'utente */
      await this.addToExistingTeam(user, this.TEAM_CODE);
    });
  }

  private async initHttp(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    if (!userId) throw new Error('retry', { cause: 'retry' });

    await this.loaderService.executeWithDelay(async () => {
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
    });
  }

  /* -------------------- Methods: firebase -------------------- */
  protected async addTeam(eventId: string, startDate: Date): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      const user = this.lsService.getUser();
      if (!user) throw new Error('retry', { cause: 'retry' });

      /* Ottengo il nome dal prompt */
      const teamName = prompt(
        "Inserisci il nome della tua squadra (una volta iniziato l'evento non potrai più cambiare)"
      );
      if (!teamName) return;

      /* Aggiungo Team al DB */
      const team = await this.teamService.add(user, eventId, startDate, teamName);
      if (!team) {
        this.logService.addLogErrorApp('Il nome della squadra scelto è già in uso. Scegli un nome diverso');
        return;
      }

      /* Aggiungo partecipazione */
      await this.addParticipation(eventId, team.id, user.id);

      /* Log e clipboard */
      if (navigator && navigator.clipboard) {
        navigator.clipboard.writeText(team.props.code);
        this.logService.addLogConfirm(`Squadra creata. Codice [${team.props.code}] copiato negli appunti`);
      } else {
        this.logService.addLogConfirm(`Squadra creata`);
      }
    });
  }

  protected async findTeam(): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      const user = this.lsService.getUser();
      if (!user) throw new Error('retry', { cause: 'retry' });

      /* Ottengo il codice dal prompt */
      const teamCode = prompt(
        "Inserisci il codice della tua squadra (una volta iniziato l'evento non potrai più cambiare)"
      );
      if (!teamCode) return;

      /* Cerca la squadra e, se possibile, aggiunge l'utente */
      await this.addToExistingTeam(user, teamCode);
    });
  }

  protected async deleteTeam(eventId: string, eventStartDate: Date, teamId: string): Promise<void> {
    const userConfirm = confirm('Sei sicuro di voler uscire dalla squadra?');
    if (!userConfirm) return;

    if (eventStartDate.getTime() < new Date().getTime()) {
      this.logService.addLogErrorApp('Operazione non più possibile, evento iniziato');
      return;
    }

    await this.loaderService.executeImmediate(async () => {
      const userId = this.firebaseService.userFirebase()?.uid;
      const team = this.teams().find((x) => x.id === teamId);
      if (!userId || !team) throw new Error('retry', { cause: 'retry' });

      /* Elimino da squadra */
      const teamUpdated = await this.teamService.deleteFromTeam(team, userId);

      /* Elimino squadra (se non ha più nessun membro) */
      if (teamUpdated.props.userIds.length <= 0) {
        await this.teamService.softDelete([team.id]);
        await this.eventService.updateTeams('REMOVE', eventId, team.id);
      }

      /* Elimino partecipazione dall'utente */
      await this.userService.updateParticipations('REMOVE', userId, eventId, team.id);

      /* Aggiorno indexedDb */
      await this.dbService.deleteTeams([team.id]);
      await this.initIndexedDb();

      /* Log */
      this.logService.addLogConfirm('Non fai più parte della squadra');
    });
  }
  /* -------------------- Methods: on event -------------------- */
  protected async onGoToTeam(eventId: string, teamId: string): Promise<void> {
    await this.router.navigate([`user/events/${eventId}/team/${teamId}`]);
  }

  /* -------------------- Methods: utils -------------------- */
  private async addToExistingTeam(user: Doc<User>, teamCode: string) {
    /* Controllo se esiste una squadra con quel codice */
    const team = await this.teamService.getTeamByCode(teamCode);
    if (!team) {
      this.logService.addLogErrorApp('Nessuna squadra trovata');
      return;
    }

    /* Controllo che l'utente non faccia già parte della squadra */
    if (team.props.userIds.includes(user.id)) {
      this.logService.addLogErrorApp('Fai già parte della squadra (usato link di invito)');
      return;
    }

    /* Controllo se la squadra ha raggiunto il limite di 10 membri */
    if (team.props.userIds.length >= 10) {
      this.logService.addLogErrorApp('Squadra al completo (10 membri)');
      return;
    }

    /* Aggiungo user al team */
    await this.teamService.updateNewUser(team, user);

    /* Aggiungo partecipazione */
    await this.addParticipation(team.props.eventId, team.id, user.id);

    /* Log */
    this.logService.addLogConfirm('Ora fai parte della squadra, buona fortuna');
  }

  private async addParticipation(eventId: string, teamId: string, userId: string): Promise<void> {
    /* Aggiorno User (prop: eventIds e teamIds) */
    await this.userService.updateParticipations('ADD', userId, eventId, teamId);

    /* Aggiorno Event (prop: teamIds) */
    await this.eventService.updateTeams('ADD', eventId, teamId);

    /* Aggiorno lista e indexedDb */
    const newTeam = await this.teamService.getTeamById(teamId);
    this.dbService.saveTeams([newTeam]);
    await this.initIndexedDb();
  }
}
