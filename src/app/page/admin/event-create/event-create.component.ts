import { EventChallengeService } from './../../../service/event-challenge.service';
import { CommonModule, formatDate, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Doc } from '../../../model/firebase';
import { Event as FvEvent } from '../../../model/event.model';
import { EventModel, FromMap } from '../../../model/form.model';
import { EventService } from '../../../service/event.service';
import { endDateValidator, trimFormValues } from '../../../util/utils';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { FvTextAeraComponent } from '../../../components/fv-text-area.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { TitleComponent } from '../../../components/title/title.component';
import { LoaderService } from '../../../service/loader.service';
import { LogService } from '../../../service/log.service';
import { StorageService } from '../../../service/storage.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
import { TeamService } from '../../../service/team.service';
import { UserService } from '../../../service/user.service';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FaIconComponent,
    TitleComponent,
    FvFieldComponent,
    FvTextAeraComponent,
    FvButtonComponent
  ],
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCreateComponent implements OnInit {
  /* Services */
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly storageService = inject(StorageService);
  private readonly userService = inject(UserService);
  private readonly eventService = inject(EventService);
  private readonly teamService = inject(TeamService);
  private readonly eventChallengeService = inject(EventChallengeService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Variables */
  event = signal<Doc<FvEvent> | undefined>(undefined);
  imagePreview = signal<string | ArrayBuffer | undefined>(undefined);
  imageFile = signal<File | undefined>(undefined);

  /* Constants */
  NOW = new Date();

  /* Icons */
  ICON_UPLOAD = faUpload;
  ICON_TRASH = faTrash;

  /* Form */
  eventForm = new FormGroup<FromMap<EventModel>>(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)]
      }),
      description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(500)]
      }),
      location: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(200)]
      }),
      startDate: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      endDate: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    },
    { validators: endDateValidator }
  );

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => await this.initHttp(params));
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initHttp(params: ParamMap) {
    await this.loaderService.executeWithDelay(async () => {
      const eventId = params.get('eventId');
      if (!eventId) return;

      /* Ottengo event */
      const event = await this.eventService.getEventById(eventId);
      this.event.set(event);

      /* Setto form */
      this.eventForm.patchValue({
        ...event.props,
        startDate: formatDate(event.props.startDate, 'yyyy-MM-dd HH:mm:ss', 'it'),
        endDate: formatDate(event.props.endDate, 'yyyy-MM-dd HH:mm:ss', 'it')
      });

      /* Immagine */
      this.imagePreview.set(event.props.imageUrl);
    });
  }

  /* ------------------------ Methods: firebase ------------------------ */
  protected async addOrUpdateEvent(): Promise<void> {
    if (this.eventForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    /* Controllo che la nuova data di inizio evento non sia nel passato */
    const form = this.eventForm.getRawValue();
    if (new Date(form.startDate).getTime() < new Date().getTime()) {
      this.logService.addLogErrorApp("L'orario di inizio non deve essere già passato");
      return;
    }

    await this.loaderService.executeImmediate(async () => {
      const event = this.event();
      const eventModelForm = trimFormValues(form);

      if (!event) await this.addEvent(eventModelForm);
      else await this.updateEvent(event, eventModelForm);
    });
  }

  protected async deleteEvent(eventId: string, eventStartDate: Date): Promise<void> {
    const userConfirm = confirm(
      "Sei sicuro di voler eliminare l'evento? Tutte le squadre e le sfide associate verranno eliminate di conseguenza"
    );
    if (!userConfirm) return;

    if (eventStartDate.getTime() < new Date().getTime()) {
      this.logService.addLogErrorApp('Operazione non più possibile, evento iniziato');
      return;
    }

    await this.loaderService.executeImmediate(async () => {
      /* Elimino evento */
      await this.eventService.softDelete(eventId);

      /* Elimino squadre associate all'evento */
      const teams = await this.teamService.getActiveTeamsByEventId(eventId);
      await this.teamService.softDelete(teams.map((x) => x.id));

      /* Elimino le partecipazioni dei membri delle varie squadre eliminate */
      const participations = teams.flatMap((team) =>
        team.props.userIds.map((userId) => ({
          userId,
          participation: { eventId, teamId: team.id }
        }))
      );
      await Promise.all(
        participations.map((x) =>
          this.userService.updateParticipations('REMOVE', x.userId, x.participation.eventId, x.participation.teamId)
        )
      );

      /* Elimino eventChallenge associate all'evento */
      const eventChallenges = await this.eventChallengeService.getEventChallengesByProp([
        { key: 'eventId', value: eventId }
      ]);
      await this.eventChallengeService.delete(eventChallenges.map((x) => x.id));

      /* Torno indietro */
      this.location.back();

      /* Log */
      this.logService.addLogConfirm('Evento eliminato');
    });
  }

  /* ------------------------------- Methods: event ------------------------------- */
  protected onImageChange(event: Event): void {
    this.storageService.onImageChange(event, this.imagePreview, this.imageFile);
  }

  /* ------------------------------- Methods: util  ------------------------------- */
  private async addEvent(form: EventModel): Promise<void> {
    /* Creo id documento */
    const eventId = this.eventService.createId();

    /* Creo immagine */
    const imageUrl = await this.eventService.addImage(this.imageFile()!, eventId);

    /* Creazione evento */
    await this.eventService.add(eventId, form, imageUrl);

    /* Torno indietro */
    this.location.back();

    /* Log */
    this.logService.addLogConfirm('Evento aggiunto');
  }

  private async updateEvent(event: Doc<FvEvent>, form: EventModel): Promise<void> {
    /* Controllo che l'evento non sia già iniziato */
    if (event.props.startDate.getTime() < new Date().getTime()) {
      this.logService.addLogErrorApp('Operazione non più possibile, evento iniziato');
      return;
    }

    /* Controllo che non si sia sbagliato con l'aggiornamento della data */
    const isNewStartDate = event.props.startDate.getTime() !== new Date(form.startDate).getTime();
    if (isNewStartDate) {
      const userConfirm = confirm('Data di inizio aggiornata, proseguire?');
      if (!userConfirm) return;
    }

    /* Aggiorno evento */
    await this.eventService.update(event.id, form);

    /* Aggiorno squadre e eventChallenge collegati all'evento */
    if (isNewStartDate) {
      const [teams, eventChallenges] = await Promise.all([
        this.teamService.getActiveTeamsByEventId(event.id),
        this.eventChallengeService.getEventChallengesByProp([{ key: 'eventId', value: event.id }])
      ]);
      await Promise.all([
        this.teamService.updateProps(
          teams.map((x) => x.id),
          { eventStartDate: new Date(form.startDate) }
        ),
        this.eventChallengeService.updateProps(
          eventChallenges.map((x) => x.id),
          { eventStartDate: new Date(form.startDate) }
        )
      ]);
    }

    /* Torno indietro */
    this.location.back();

    /* Log */
    this.logService.addLogConfirm('Evento aggiornato');
  }
}
