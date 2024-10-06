import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { EventChallengeService } from '../../../service/event-challenge.service';
import { ChallengeService } from '../../../service/challenge.service';
import { Doc } from '../../../model/firebase';
import { ChallengeStatus, EventChallenge } from '../../../model/event-challenge.model';
import { EventChallengeModel, FromMap } from '../../../model/form.model';
import { Challenge } from '../../../model/challenge.model';
import { endDateValidator } from '../../../util/utils';
import EventChallengeStatus from './event-challenge-status.config.json';
import { FvFloatingButtonComponent } from '../../../components/fv-floating-button.component';

export type SelectOption = {
  label: string;
  status: ChallengeStatus;
};

@Component({
  selector: 'app-event-challenge',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent, FvFloatingButtonComponent],
  templateUrl: './event-challenge.component.html',
  styleUrls: ['./event-challenge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventChallengeComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly challengeService = inject(ChallengeService);
  readonly eventChallengeService = inject(EventChallengeService);

  /* Variables */
  eventId = signal<string | undefined>(undefined);
  challenges = signal<Doc<Challenge>[]>([]);
  eventChallenge = signal<Doc<EventChallenge> | undefined>(undefined);
  eventChallenges = signal<Doc<EventChallenge>[]>([]);
  formModalIsOpen = signal<boolean>(false);

  /* Constants */
  OPTIONS = EventChallengeStatus as SelectOption[];

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

    const eventChallengeId = this.eventChallenge()?.id;
    if (!eventChallengeId) {
      /* Aggiungo a DB e aggiorno array */
      const newEventChallengeId = await this.eventChallengeService.addEventChallenge(eventChallenge);
      this.eventChallenges.update((eventChallenges) => [
        ...eventChallenges,
        { id: newEventChallengeId, props: eventChallenge }
      ]);
    } else {
      /* Aggiorno DB e array */
      await this.eventChallengeService.updateEventChallenge(eventChallengeId, eventChallenge);
      this.eventChallenges.update((eventChallenges) =>
        eventChallenges.map((x) => (x.id === eventChallengeId ? { id: eventChallengeId, props: eventChallenge } : x))
      );
    }

    /* Chiudo il modal e resetto il form */
    this.formModalIsOpen.set(false);
    this.eventChallengeForm.reset();
  }

  /* -------------------- Methods: utils -------------------- */
  protected onBackdropClick(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.dataset['dialogBackdrop'] === 'sign-in-modal') {
      this.eventChallenge.set(undefined);
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
    this.eventChallenge.set(eventChallengeActive);

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
