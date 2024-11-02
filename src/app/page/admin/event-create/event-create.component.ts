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

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  private readonly eventService = inject(EventService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Variables */
  event = signal<Doc<FvEvent> | undefined>(undefined);
  imagePreview = signal<string | ArrayBuffer | undefined>(undefined);
  imageFile = signal<File | undefined>(undefined);

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

      /* Info generali */
      const event = await this.eventService.getEventById(eventId);
      this.event.set(event);
      this.eventForm.setValue({
        name: event.props.name,
        description: event.props.description,
        location: event.props.location,
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

    await this.loaderService.executeImmediate(async () => {
      const event = this.event();
      const form = trimFormValues(this.eventForm.getRawValue());
      if (event) {
        await this.eventService.updateEvent(event.id, form);

        /* Torno indietro */
        this.location.back();

        /* Torno indietro */
        this.logService.addLogConfirm('Evento aggiornato');
        return;
      }

      /* Creo id documento */
      const eventId = this.eventService.createEventId();

      /* Creo immagine */
      const imageUrl = await this.eventService.addEventImage(this.imageFile()!, eventId);

      /* Creazione evento */
      await this.eventService.addEvent(eventId, form, imageUrl);

      /* Torno indietro */
      this.location.back();

      /* Log */
      this.logService.addLogConfirm('Evento aggiunto');
    });
  }

  /* ------------------------------- Methods: event ------------------------------- */
  protected onImageChange(event: Event) {
    this.storageService.onImageChange(event, this.imagePreview, this.imageFile);
  }
}
