import { trimFormValues } from './../../../util/utils';
import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowsRotate,
  faBan,
  faCalendar,
  faClock,
  faInfinity,
  faLock,
  faMobileScreenButton,
  faPause,
  faPlay,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { Doc } from '../../../model/firebase';
import { EventChallenge, ChallengeStatus } from '../../../model/event-challenge.model';
import { EventChallengeModel, FromMap } from '../../../model/form.model';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { LogService } from '../../../service/log.service';
import { Challenge, ChallengeType } from '../../../model/challenge.model';
import { FvFloatingButtonComponent } from '../../../components/fv-floating-button.component';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { FvSelectComponent, SelectOption } from '../../../components/fv-select.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { FvButtonOutlinedComponent } from '../../../components/fv-button-outlined.component';
import { TitleComponent } from '../../../components/title/title.component';
import EventChallengeStatus from './event-challenge-status.config.json';
import { endDateValidator } from '../../../util/utils';
import { IndexedDbService } from '../../../service/indexed-db.service';
import { LoaderService } from '../../../service/loader.service';
import { EventService } from '../../../service/event.service';
import { Event } from '../../../model/event.model';

@Component({
  selector: 'app-event-challenge',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FaIconComponent,
    TitleComponent,
    FvFieldComponent,
    FvSelectComponent,
    FvButtonOutlinedComponent,
    FvButtonComponent,
    FvFloatingButtonComponent
  ],
  templateUrl: './event-challenge.component.html',
  styleUrls: ['./event-challenge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventChallengeComponent implements OnInit {
  /* Services */
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly challengeService = inject(ChallengeService);
  private readonly eventChallengeService = inject(EventChallengeService);
  private readonly dbService = inject(IndexedDbService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Variables */
  event = signal<Doc<Event> | undefined>(undefined);
  challenges = signal<Doc<Challenge>[]>([]);
  eventChallenges = signal<Doc<EventChallenge>[]>([]);
  eventChallengeSelected = signal<Doc<EventChallenge> | undefined>(undefined);
  challengesOptions = computed(() => this.challenges().map((x) => ({ label: x.props.name, value: x.id })));
  formModalIsOpen = signal<boolean>(false);

  /* Constants */
  OPTIONS = EventChallengeStatus as SelectOption<ChallengeStatus>[];
  NOW = new Date();

  /* Enum */
  CHALLENGE_STATUS = ChallengeStatus;

  /* Icons */
  ICON_STATUS = faMobileScreenButton;
  ICON_CALENDAR = faCalendar;
  ICON_CLOCK = faClock;
  ICON_STATUS_VALUE = {
    ACTIVE: faPlay,
    LOCKED: faLock,
    CANCELED: faTrash,
    SUSPENDED: faPause,
    CHALLENGE_DELETED: faBan
  };
  ICON_INFINITY = faInfinity;
  ICON_TRASH = faTrash;
  ICON_REFRESH = faArrowsRotate;

  /* Form */
  eventChallengeForm = new FormGroup<FromMap<EventChallengeModel>>(
    {
      challengeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      status: new FormControl(ChallengeStatus.ACTIVE, { nonNullable: true, validators: [Validators.required] }),
      maxTimes: new FormControl(null),
      startDate: new FormControl(null),
      endDate: new FormControl(null)
    },
    { validators: endDateValidator }
  );

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    /* Inizializzazione indexedDB */
    await this.initIndexedDb();

    /* Inizializzazione http */
    this.route.paramMap.subscribe(async (params) => await this.initHttp(params));
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initIndexedDb() {
    /* Ottengo le sfide dal indexedDB per limitare il numero di letture */
    const challenges = await this.dbService.getAdminChallenges();
    this.challenges.set(challenges);
  }

  private async initHttp(params: ParamMap) {
    await this.loaderService.executeWithDelay(async () => {
      // Recupera l'ID dell'evento dalla route
      const eventId = params.get('eventId');
      if (!eventId) throw new Error('retry', { cause: 'retry' });

      /* Ottengo l'evento e le sfide che fanno parte */
      const [event, eventChallenges] = await Promise.all([
        this.eventService.getEventById(eventId),
        this.eventChallengeService.getEventChallengesByProp([{ key: 'eventId', value: eventId }])
      ]);
      this.event.set(event);
      this.eventChallenges.set(eventChallenges);
    });
  }

  /* -------------------- Methods: firebase -------------------- */
  protected async addOrUpdateEventChallenge() {
    if (this.eventChallengeForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    if (this.event() && this.event()!.props.startDate < new Date()) {
      this.logService.addLogErrorApp('Operazione non più possibile, evento iniziato');
      return;
    }

    await this.loaderService.executeImmediate(async () => {
      const form = trimFormValues(this.eventChallengeForm.getRawValue());
      const eventChallengeSelected = this.eventChallengeSelected();
      if (!eventChallengeSelected) {
        /* Aggiorno db */
        /* Controllo che la sfida non sia gia presente */
        const challengeIds = this.eventChallenges().map((x) => x.props.challengeId);
        if (challengeIds.includes(form.challengeId)) {
          this.logService.addLogErrorApp("Sfida gia presente nell'evento");
          return;
        }

        const challenge = this.challenges().find((x) => x.id === form.challengeId);
        const { name, type } = challenge!.props;
        const eventChallenge = this.createChallenge(name, type, form);
        const newEventChallenge = await this.eventChallengeService.addEventChallenge(eventChallenge);

        /* Aggiorno app */
        this.eventChallenges.update((eventChallenges) => [...eventChallenges, newEventChallenge]);
      } else {
        /* Aggiorno db */
        const { challengeName, challengeType } = eventChallengeSelected.props;
        const eventChallenge = this.createChallenge(challengeName, challengeType, form);
        await this.eventChallengeService.updateEventChallenge(eventChallengeSelected.id, eventChallenge);

        /* Aggiorno app */
        eventChallengeSelected.props = eventChallenge;
      }

      /* Chiudo il modal e resetto il form */
      this.resetForm();

      /* Log */
      this.logService.addLogConfirm(eventChallengeSelected ? 'Sfida aggiornata' : 'Sfida aggiunta');
    });
  }

  protected async deleteEventChallenge(eventChallengeId: string, eventStartDate: Date): Promise<void> {
    const userConfirm = confirm("Sei sicuro di voler eliminare la sfida dall'evento?");
    if (!userConfirm) return;

    if (eventStartDate < new Date()) {
      this.logService.addLogErrorApp('Operazione non più possibile, evento iniziato');
      return;
    }

    await this.loaderService.executeImmediate(async () => {
      /* Elimino il documento */
      await this.eventChallengeService.deleteEventChallenge(eventChallengeId);
      this.eventChallenges.update((eventChallenges) => eventChallenges.filter((x) => x.id !== eventChallengeId));

      /* Log */
      this.logService.addLogConfirm('Sfida eliminata');
    });
  }

  protected async onRefreshChallenges(): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      const challenges = await this.challengeService.getAllChallenges();
      this.challenges.set(challenges);

      /* Aggiorno indexedDb */
      await this.dbService.saveAdminChallenges(challenges);

      /* Log */
      this.logService.addLogConfirm('Lista sfide aggiornata');
    });
  }

  /* -------------------- Methods: event -------------------- */
  protected onCloseModal(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.dataset['dialogBackdrop'] === 'sign-in-modal') {
      /* Chiudo il modal e resetto il form */
      this.resetForm();
    }
  }

  protected goToUpdateEventChallenge(eventChallengeId: string): void {
    const eventChallengeSelected = this.eventChallenges().find((x) => x.id === eventChallengeId);
    if (!eventChallengeSelected) throw new Error('retry', { cause: 'retry' });

    /* Setto l'id selezionato (add or update) */
    this.eventChallengeSelected.set(eventChallengeSelected);

    /* Aggiorno il form */
    const { startDate, endDate } = eventChallengeSelected.props;
    this.eventChallengeForm.patchValue({
      ...eventChallengeSelected.props,
      startDate: startDate ? formatDate(startDate, 'yyyy-MM-dd HH:mm:ss', 'it') : null,
      endDate: endDate ? formatDate(endDate, 'yyyy-MM-dd HH:mm:ss', 'it') : null
    });

    this.eventChallengeForm.get('challengeId')?.disable();

    /* Apro il modal */
    this.formModalIsOpen.set(true);
  }

  protected onExecuteFloatingButton(): void {
    this.formModalIsOpen.set(true);
  }

  /* -------------------- Methods: utils -------------------- */
  private createChallenge(
    challengeName: string,
    challengeType: ChallengeType,
    form: EventChallengeModel
  ): EventChallenge {
    const event = this.event();
    if (!event) throw new Error('retry', { cause: 'retry' });

    const eventChallenge: EventChallenge = {
      eventId: event.id,
      eventStartDate: event.props.startDate,
      challengeId: form.challengeId,
      challengeName,
      challengeType,
      status: form.status,
      maxTimes: form.maxTimes,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
      updatedAt: new Date()
    };
    return eventChallenge;
  }

  private resetForm(): void {
    this.formModalIsOpen.set(false);
    this.eventChallengeSelected.set(undefined);
    this.eventChallengeForm.reset();
    this.eventChallengeForm.get('challengeId')?.enable();
  }
}
