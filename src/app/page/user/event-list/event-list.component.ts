/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCrown, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { Doc } from '../../../model/firebase';
import { Event } from '../../../model/event.model';
import { FindTeamModel, FromMap, NewTeamModel } from '../../../model/form.model';
import { CheckExistTeamPipe } from '../../../pipe/check-exist-team.pipe';
import { EventService } from '../../../service/event.service';
import { FirebaseService } from '../../../service/firebase.service';
import { LogService } from '../../../service/log.service';
import { TeamService } from '../../../service/team.service';
import { EventTeamUserService } from '../../../service/event-team-user.service';
import { UserService } from '../../../service/user.service';
import { FvFieldIconComponent } from '../../../components/fv-field-icon.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { TitleComponent } from '../../../components/title/title.component';
import { FvButtonOutlinedComponent } from '../../../components/fv-button-outlined.component';
import { ChallengeService } from '../../../service/challenge.service';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { EventTeamUser } from '../../../model/event-team-user.model';

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
    FvRatingComponent,
    CheckExistTeamPipe
  ],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  animations: [
    trigger('liAnimation1', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }), // Inizia con scale ridotto e opacità 0
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 })) // Ingrandisci a dimensione naturale
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'scale(0.9)', opacity: 0 })) // Rimpicciolisci a 0.9 e riduci opacità
      ])
    ])
  ],
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
  readonly eventTeamUserService = inject(EventTeamUserService);
  readonly logService = inject(LogService);

  /* Variables */
  mergedEvents = signal<{ event: Doc<Event>; eventTeamUser: Doc<EventTeamUser> | undefined }[]>([]);
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
    const [events, eventTeamUsers] = await Promise.all([
      this.eventService.getEventsFromDate(),
      this.eventTeamUserService.getEventTeamUsersByProp([{ key: 'userId', value: userId }])
    ]);

    /* Metto insieme i dati */
    const mergedEvents = events.map((event) => {
      const eventTeamUser = eventTeamUsers.find((x) => x.props.eventId === event.id);
      return { event, eventTeamUser };
    });
    this.mergedEvents.set(mergedEvents);
  }

  /* -------------------- Methods: firebase -------------------- */
  protected async addTeam(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    const eventId = this.eventIdSelected();
    if (!userId || !eventId) throw new Error('retry', { cause: 'retry' });

    /* Aggiungo Team al DB */
    const form = this.newTeamForm.getRawValue();
    const team = await this.teamService.addTeam(userId, eventId, form);

    /* Ottengo la data di inizio dell'evento */
    const events = this.mergedEvents().map((x) => x.event);
    const currentEvent = events.find((x) => x.id === eventId);
    if (!currentEvent) throw new Error('retry', { cause: 'retry' });

    /* Aggiungo partecipazione */
    await this.addParticipation(eventId, team.id, userId);

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
    /* Ottengo la data di inizio dell'evento */
    const events = this.mergedEvents().map((x) => x.event);
    const currentEvent = events.find((x) => x.id === eventId);
    if (!currentEvent) throw new Error('retry', { cause: 'retry' });

    /* Aggiungo EventTeamUser al DB */
    const eventTeamUserRef = await this.eventTeamUserService.addEventTeamUser(
      eventId,
      teamId,
      userId,
      currentEvent.props.startDate
    );

    /* Aggiorno User (prop: eventTeamUserRefs) */
    await this.userService.updateEventTeamUser(userId, eventTeamUserRef.id);

    /* Aggiorno Event (prop: eventTeamUserRefs) */
    await this.eventService.updateEventTeamUser(eventId, eventTeamUserRef.id);

    /* Aggiorno Team (prop: eventTeamUserRefs) */
    await this.teamService.updateEventTeamUser(teamId, eventTeamUserRef.id);

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
