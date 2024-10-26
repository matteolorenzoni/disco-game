/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCrown, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { FindTeamModel, FromMap, NewTeamModel } from '../../../model/form.model';
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
    ReactiveFormsModule,
    FaIconComponent,
    TitleComponent,
    FvFieldIconComponent,
    FvButtonComponent,
    FvButtonOutlinedComponent,
    FvRatingComponent
  ],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
  eventIdSelected = signal<string | undefined>(undefined);

  /* Variables modal */
  newTeamModalIsOpen = signal<boolean>(false);
  findTeamModalIsOpen = signal<boolean>(false);

  /* Form */
  newTeamForm = new FormGroup<FromMap<NewTeamModel>>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)]
    })
  });
  findTeamForm = new FormGroup<FromMap<FindTeamModel>>({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)]
    })
  });

  /* Icons */
  ICON_CROWN = faCrown;
  ICON_TEAM = faPeopleGroup;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    if (!userId) throw new Error('retry', { cause: 'retry' });

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
  protected async addTeam(): Promise<void> {
    const user = this.lsService.getUser();
    const event = this.mergedEvents()!.find((x) => x.id === this.eventIdSelected());
    if (!user || !event) throw new Error('retry', { cause: 'retry' });

    /* Aggiungo Team al DB */
    const form = this.newTeamForm.getRawValue();
    const team = await this.teamService.addTeam(user, event.id, event.startDate, form);
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

  protected async findTeam(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    const eventId = this.eventIdSelected();
    if (!userId || !eventId) throw new Error('retry', { cause: 'retry' });

    /* Controllo se esiste una squadra con quel codice */
    const form = this.findTeamForm.getRawValue();
    const team = await this.teamService.getTeamByCode(form.code);
    if (!team) {
      this.logService.addLogError(userId, 'Nessuna squadra trovata');
      return;
    }

    /* Aggiungo partecipazione */
    await this.addParticipation(eventId, team.id, userId);

    /* Log */
    this.logService.addLogConfirm('Ora fai parte della squadra, buona fortuna');
  }

  /* -------------------- Methods: on event -------------------- */
  protected openNewTeamModal(eventId: string): void {
    this.eventIdSelected.set(eventId);
    this.newTeamModalIsOpen.set(true);
  }

  protected openFindTeamModal(eventId: string): void {
    this.eventIdSelected.set(eventId);
    this.findTeamModalIsOpen.set(true);
  }

  protected onBackdropClick(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.dataset['dialogBackdrop'] === 'sign-in-modal') {
      this.resetModalsAndForms();
    }
  }

  protected async onGoToTeam(eventId: string, teamId: string): Promise<void> {
    await this.router.navigate([`user/events/${eventId}/${teamId}`]);
  }

  /* -------------------- Methods: utils -------------------- */
  private async addParticipation(eventId: string, teamId: string, userId: string): Promise<void> {
    /* Aggiorno User (prop: eventIds e teamIds) */
    await this.userService.updateEventsAndTeams(eventId, teamId, userId);

    /* Aggiorno Event (prop: teamIds) */
    await this.eventService.updateTeams(eventId, teamId);

    /* Chiude modal e reset form */
    this.resetModalsAndForms();
  }

  private resetModalsAndForms(): void {
    this.eventIdSelected.set(undefined);
    this.newTeamModalIsOpen.set(false);
    this.findTeamModalIsOpen.set(false);
    this.newTeamForm.reset();
    this.findTeamForm.reset();
  }
}
