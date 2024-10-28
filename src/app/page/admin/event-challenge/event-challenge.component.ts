import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
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
import { endDateValidator } from '../../../util/utils';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { FvFloatingButtonComponent } from '../../../components/fv-floating-button.component';
import EventChallengeStatus from './event-challenge-status.config.json';
import { LogService } from '../../../service/log.service';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { FvSelectComponent, SelectOption } from '../../../components/fv-select.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { TitleComponent } from '../../../components/title/title.component';
import { FvButtonOutlinedComponent } from '../../../components/fv-button-outlined.component';
import { Challenge } from '../../../model/challenge.model';

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
  private readonly challengeService = inject(ChallengeService);
  private readonly eventChallengeService = inject(EventChallengeService);
  private readonly logService = inject(LogService);

  /* Variables */
  eventId = signal<string | undefined>(undefined);
  challenges = signal<Doc<Challenge>[]>([]);
  eventChallenges = signal<Doc<EventChallenge>[]>([]);
  eventChallengeSelected = signal<Doc<EventChallenge> | undefined>(undefined);
  challengesOptions = computed(() => this.challenges().map((x) => ({ label: x.props.name, value: x.id })));
  formModalIsOpen = signal<boolean>(false);

  /* Constants */
  OPTIONS = EventChallengeStatus as SelectOption<ChallengeStatus>[];

  /* Icons */
  ICON_STATUS = faMobileScreenButton;
  ICON_CALENDAR = faCalendar;
  ICON_CLOCK = faClock;
  ICON_STATUS_VALUE = {
    ACTIVE: faPlay,
    LOCKED: faLock,
    CANCELED: faTrash,
    SUSPENDED: faPause
  };
  ICON_INFINITY = faInfinity;
  ICON_TRASH = faTrash;

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
    // Recupera l'ID dell'evento dalla route
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('eventId');
      this.eventId.set(eventId ?? undefined);
      if (!eventId) throw new Error('retry', { cause: 'retry' });

      /* Ottengo le sfide per la combo e le eventChallenge da mostrare nella lista */
      const [challenges, eventChallenges] = await Promise.all([
        this.challengeService.getChallenges(),
        this.eventChallengeService.getEventChallengesByProp([{ key: 'eventId', value: eventId }])
      ]);
      this.challenges.set(challenges);
      this.eventChallenges.set(eventChallenges);
    });
  }

  /* -------------------- Methods: firebase -------------------- */
  protected async addOrUpdateEventChallenge() {
    if (this.eventChallengeForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    /* Recupero le info della sfida selezionata */
    const form = this.eventChallengeForm.getRawValue();
    const eventId = this.eventId();
    const challenge = this.challenges().find((x) => x.id === form.challengeId);
    if (!eventId || !challenge) throw new Error('retry', { cause: 'retry' });

    /* Creo una nuova entry (sia per la creazione che per l'aggiornamento), i valori del form vengono messi qui */
    const eventChallenge: EventChallenge = {
      eventId,
      challengeId: form.challengeId,
      challengeName: challenge.props.name,
      challengeType: challenge.props.type,
      status: form.status,
      maxTimes: form.maxTimes,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
      updatedAt: new Date()
    };

    let eventChallengeSelected = this.eventChallengeSelected();
    if (!eventChallengeSelected) {
      /* Aggiungo a DB e aggiorno array */
      eventChallengeSelected = await this.eventChallengeService.addEventChallenge(eventChallenge);
      this.eventChallenges.update((eventChallenges) => [...eventChallenges, eventChallengeSelected!]);
    } else {
      /* Aggiorno DB e array */
      await this.eventChallengeService.updateEventChallenge(eventChallengeSelected.id, eventChallenge);
      eventChallengeSelected.props = eventChallenge;
    }

    /* Chiudo il modal e resetto il form */
    this.resetForm();

    /* Log */
    this.logService.addLogConfirm(this.eventChallengeSelected() ? 'Sfida aggiornata' : 'Sfida aggiunta');
  }

  /* -------------------- Methods: event -------------------- */
  protected onBackdropClick(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.dataset['dialogBackdrop'] === 'sign-in-modal') {
      /* Chiudo il modal e resetto il form */
      this.resetForm();
    }
  }

  protected executeFloatingButton(): void {
    this.formModalIsOpen.set(true);
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

  protected async deleteEventChallenge(eventChallengeId: string): Promise<void> {
    const userConfirm = confirm("Sei sicuro di voler eliminare la sfida dall'evento?");
    if (!userConfirm) return;

    const eventId = this.eventId();
    if (!eventId) throw new Error('retry', { cause: 'retry' });

    /* Elimino il documento */
    await this.eventChallengeService.deleteEventChallenge(eventChallengeId);
    this.eventChallenges.update((eventChallenges) => eventChallenges.filter((x) => x.id !== eventChallengeId));

    /* Log */
    this.logService.addLogConfirm('Sfida eliminata');
  }

  /* -------------------- Methods: utils -------------------- */
  private resetForm(): void {
    this.formModalIsOpen.set(false);
    this.eventChallengeSelected.set(undefined);
    this.eventChallengeForm.reset();
    this.eventChallengeForm.get('challengeId')?.enable();
  }
}
