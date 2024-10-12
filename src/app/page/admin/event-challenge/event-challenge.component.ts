import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCalendar,
  faClock,
  faHourglassEnd,
  faHourglassStart,
  faInfinity,
  faLock,
  faMobileScreenButton,
  faPause,
  faPen,
  faPlay,
  faStopwatch20,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { Challenge } from '../../../model/challenge.model';
import { Doc } from '../../../model/firebase';
import { EventChallenge, ChallengeStatus } from '../../../model/event-challenge.model';
import { EventChallengeModel, FromMap } from '../../../model/form.model';
import { endDateValidator } from '../../../util/utils';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { EventService } from '../../../service/event.service';
import { FvFloatingButtonComponent } from '../../../components/fv-floating-button.component';
import EventChallengeStatus from './event-challenge-status.config.json';
import { LogService } from '../../../service/log.service';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { FvSelectComponent, SelectOption } from '../../../components/fv-select.component';

@Component({
  selector: 'app-event-challenge',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FaIconComponent,
    FvFieldComponent,
    FvSelectComponent,
    FvFloatingButtonComponent
  ],
  templateUrl: './event-challenge.component.html',
  styleUrls: ['./event-challenge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventChallengeComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly eventService = inject(EventService);
  readonly challengeService = inject(ChallengeService);
  readonly eventChallengeService = inject(EventChallengeService);
  readonly logService = inject(LogService);

  /* Variables */
  eventId = signal<string | undefined>(undefined);
  challenges = signal<Doc<Challenge>[]>([]);
  challengesOptions = signal<SelectOption<string>[]>([]);
  eventChallenges = signal<Doc<EventChallenge>[]>([]);
  eventChallengeActive = signal<Doc<EventChallenge> | undefined>(undefined);
  formModalIsOpen = signal<boolean>(false);

  /* Constants */
  OPTIONS = EventChallengeStatus as SelectOption<ChallengeStatus>[];

  /* Icons */
  ICON_STATUS = faMobileScreenButton;
  ICON_MAX_TIMES = faStopwatch20;
  ICON_START = faHourglassStart;
  ICON_END = faHourglassEnd;
  ICON_CALENDAR = faCalendar;
  ICON_CLOCK = faClock;
  ICON_STATUS_VALUE = {
    ACTIVE: faPlay,
    LOCKED: faLock,
    CANCELED: faTrash,
    SUSPENDED: faPause
  };
  ICON_INFINITE = faInfinity;
  ICON_PEN = faPen;

  /* Form */
  eventChallengeForm = new FormGroup<FromMap<EventChallengeModel>>(
    {
      challengeId: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      challengeStatus: new FormControl(ChallengeStatus.ACTIVE, {
        nonNullable: true,
        validators: [Validators.required]
      }),
      maxTimes: new FormControl(null),
      startDate: new FormControl(null),
      endDate: new FormControl(null)
    },
    { validators: endDateValidator }
  );

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    // Recupera l'ID dell'evento dalla route
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('eventId');
      this.eventId.set(eventId ?? undefined);
      if (!eventId) throw new Error('retry', { cause: 'retry' });

      const challenges = await this.challengeService.getChallenges();
      this.challenges.set(challenges);
      this.challengesOptions.set(challenges.map((x) => ({ label: x.props.name, value: x.id })));

      const eventChallenge = await this.eventChallengeService.getEventChallengesByEventId(eventId);
      this.eventChallenges.set(eventChallenge);
    });
  }

  /* -------------------- Methods: firebase -------------------- */
  protected async addOrUpdateEventChallenge() {
    if (this.eventChallengeForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    const form = this.eventChallengeForm.getRawValue();
    const eventId = this.eventId();
    const challengeActive = this.challenges().find((x) => x.id === form.challengeId);
    if (!eventId || !challengeActive) throw new Error('retry', { cause: 'retry' });

    /* Creo una nuova entry nel DB */
    const eventChallenge: EventChallenge = {
      eventId,
      challengeId: form.challengeId,
      challengeName: challengeActive.props.name,
      challengeType: challengeActive.props.type,
      challengeStatus: form.challengeStatus,
      maxTimes: form.maxTimes,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null
    };

    let eventChallengeActiveId = this.eventChallengeActive()?.id;
    if (!eventChallengeActiveId) {
      /* Aggiungo a DB e aggiorno array */
      eventChallengeActiveId = await this.eventChallengeService.addEventChallenge(eventChallenge);
      this.eventChallenges.update((eventChallenges) => [
        ...eventChallenges,
        { id: eventChallengeActiveId!, props: eventChallenge }
      ]);
    } else {
      /* Aggiorno DB e array */
      await this.eventChallengeService.updateEventChallenge(eventChallengeActiveId, eventChallenge);
      this.eventChallenges.update((eventChallenges) =>
        eventChallenges.map((x) =>
          x.id === eventChallengeActiveId ? { id: eventChallengeActiveId, props: eventChallenge } : x
        )
      );
    }

    /* Aggiorno Event (prop: userEventTeamRefs) */
    await this.eventService.updateEventChallenge(eventId, eventChallengeActiveId);

    /* Aggiorno Challenge (prop: userEventTeamRefs) */
    await this.challengeService.updateEventChallenge(form.challengeId, eventChallengeActiveId);

    /* Log */
    this.logService.addLogConfirm(this.eventChallengeActive() ? 'Sfida aggiornata' : 'Sfida aggiunta');

    /* Chiudo il modal e resetto il form */
    this.formModalIsOpen.set(false);
    this.eventChallengeForm.reset();
  }

  /* -------------------- Methods: utils -------------------- */
  protected onBackdropClick(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.dataset['dialogBackdrop'] === 'sign-in-modal') {
      this.eventChallengeActive.set(undefined);
      this.eventChallengeForm.reset();
      this.formModalIsOpen.set(false);
    }
  }

  protected executeFloatingButton(): void {
    this.formModalIsOpen.set(true);
  }

  protected goToUpdateEventChallenge(eventChallengeId: string) {
    const eventChallengeActive = this.eventChallenges().find((x) => x.id === eventChallengeId);
    if (!eventChallengeActive) throw new Error('retry', { cause: 'retry' });

    /* Setto l'id selezionato (add or update) */
    this.eventChallengeActive.set(eventChallengeActive);

    /* Aggiorno il form */
    const { startDate, endDate } = eventChallengeActive.props;
    this.eventChallengeForm.patchValue({
      ...eventChallengeActive.props,
      startDate: startDate ? formatDate(startDate, 'yyyy-MM-dd HH:mm:ss', 'it') : null,
      endDate: endDate ? formatDate(endDate, 'yyyy-MM-dd HH:mm:ss', 'it') : null
    });

    /* Apro il modal */
    this.formModalIsOpen.set(true);
  }
}
