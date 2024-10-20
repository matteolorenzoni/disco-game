/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendar, faCrown, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
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
import { Challenge } from '../../../model/challenge.model';
import { Team } from '../../../model/team.model';
import { register } from 'swiper/element/bundle';

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
  events = signal<Doc<Event>[]>([]);
  eventsInfo = signal<Map<string, { team: Doc<Team> | undefined; challenges: Doc<Challenge>[] }>>(new Map());
  current = signal<{
    event: Doc<Event> | undefined;
    team: Doc<Team> | undefined;
    challenges: Doc<Challenge>[];
  }>({ event: undefined, team: undefined, challenges: [] });

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
  ICON_CALENDAR = faCalendar;
  ICON_CROWN = faCrown;
  ICON_TEAM = faPeopleGroup;

  /* -------------------- Constructor  -------------------- */
  constructor() {
    register();
  }

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    /* Ottengo tutti gli eventi attivi */
    const events = await this.eventService.getEvents();
    this.events.set(events);

    /* Aggiorna squadra e sfide associate del primo evento */
    const event = events[0] as Doc<Event> | undefined;
    if (event) {
      /* Ottengo i dati associati all'evento (siccome prima volta) */
      await this.getEventStorage(events[0]);

      /* Aggiorno le informazioni correnti */
      this.current.set({
        event,
        team: this.eventsInfo().get(event.id)?.team,
        challenges: this.eventsInfo().get(event.id)?.challenges ?? []
      });
    }
  }

  /* -------------------- Methods: firebase -------------------- */
  protected async addTeam(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    const event = this.current().event;
    if (!userId || !event) throw new Error('retry', { cause: 'retry' });

    /* Aggiungo Team al DB */
    const form = this.newTeamForm.getRawValue();
    const team = await this.teamService.addTeam(userId, event.id, form);

    /* Aggiungo EventTeamUser al DB */
    const eventTeamUserRef = await this.eventTeamUserService.addEventTeamUser(event.id, team.id, userId);

    /* Aggiorno User (prop: eventTeamUserRefs) */
    await this.userService.updateEventTeamUser(userId, eventTeamUserRef.id);

    /* Aggiorno Event (prop: eventTeamUserRefs) */
    await this.eventService.updateEventTeamUser(event.id, eventTeamUserRef.id);

    /* Aggiorno Team (prop: eventTeamUserRefs) */
    await this.teamService.updateEventTeamUser(team.id, eventTeamUserRef.id);

    /* Log */
    navigator.clipboard.writeText(team.props.code);
    this.logService.addLogConfirm(`Squadra creata! Codice ${team.props.code} negli appunti`);

    /* Chiude modal e reset form */
    this.resetModalsAndForms();
  }

  protected async findTeam(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    const event = this.current().event;
    if (!userId || !event) throw new Error('retry', { cause: 'retry' });

    const form = this.findTeamForm.getRawValue();
    const team = await this.teamService.getTeamByCode(form.code);
    if (!team) {
      this.logService.addLogError(userId, 'Nessuna squadra trovata');
      return;
    }

    /* Aggiungo EventTeamUser al DB */
    const eventTeamUserRef = await this.eventTeamUserService.addEventTeamUser(event.id, team.id, userId);

    /* Aggiorno User (prop: eventTeamUserRefs) */
    await this.userService.updateEventTeamUser(userId, eventTeamUserRef.id);

    /* Aggiorno Event (prop: eventTeamUserRefs) */
    await this.eventService.updateEventTeamUser(event.id, eventTeamUserRef.id);

    /* Aggiorno Team (prop: eventTeamUserRefs) */
    await this.teamService.updateEventTeamUser(team.id, eventTeamUserRef.id);

    /* Log */
    this.logService.addLogConfirm('Ora fai parte della squadra, buona fortuna');

    /* reset form */
    this.resetModalsAndForms();
  }

  /* -------------------- Methods: on event -------------------- */
  protected async onSlideChange(e: any): Promise<void> {
    /* Aggiorna evento selezionato */
    const index = e.detail[0].activeIndex;
    const event = this.events()[index] as Doc<Event> | undefined;
    if (!event) throw new Error('retry', { cause: 'retry' });

    /* Ottengo i dati associati all'evento (se non ancora ottenuti la prima volta) */
    if (!this.eventsInfo().has(event.id)) await this.getEventStorage(event);

    /* Aggiorno le informazioni correnti */
    this.current.set({
      event,
      team: this.eventsInfo().get(event.id)?.team,
      challenges: this.eventsInfo().get(event.id)?.challenges ?? []
    });
  }

  protected openNewTeamModal(): void {
    this.newTeamModalIsOpen.set(true);
  }

  protected openFindTeamModal(): void {
    this.findTeamModalIsOpen.set(true);
  }

  protected onBackdropClick(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.dataset['dialogBackdrop'] === 'sign-in-modal') {
      this.resetModalsAndForms();
    }
  }

  protected async onGoToTeam(teamId: string): Promise<void> {
    const event = this.current().event;
    if (!event) return;

    await this.router.navigate([`user/events/${event.id}/${teamId}`]);
  }

  protected async onGoToChallenge(challengeId: string): Promise<void> {
    const event = this.current().event;
    const team = this.current().team;
    if (!event) return;

    await this.router.navigate([`user/challenges/${event.id}/${team?.id ?? '_'}/${challengeId}`]);
  }

  /* -------------------- Methods: utils -------------------- */
  private async getEventStorage(event: Doc<Event>): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    if (!userId) throw new Error('retry', { cause: 'retry' });

    /* Ottengo le sfide e cerco se c'è una squadra */
    const [challenges, challengeService] = await Promise.all([
      this.challengeService.getChallengesByEventChallengeRefs(event.props.eventChallengeRefs),
      this.eventTeamUserService.getEventTeamUsersByProp([
        { key: 'eventId', value: event.id },
        { key: 'userId', value: userId }
      ])
    ]);

    /* Se trova una squadra ottengo i suoi dati */
    let team: Doc<Team> | undefined = undefined;
    if (challengeService.length > 0) {
      team = await this.teamService.getTeamById(challengeService[0].props.teamId);
    }

    this.eventsInfo.set(new Map([...this.eventsInfo(), [event.id, { team, challenges }]]));
  }

  private resetModalsAndForms(): void {
    this.newTeamModalIsOpen.set(false);
    this.findTeamModalIsOpen.set(false);
    this.newTeamForm.reset();
    this.findTeamForm.reset();
  }
}
