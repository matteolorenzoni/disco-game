import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { endDateValidator } from '../../../util/utils';
import { EventModel, FromMap } from '../../../model/form.model';
import { EventService } from '../../../service/event.service';
import { FirebaseService } from '../../../service/firebase.service';
import { LogService } from './../../../service/log.service';
import { StorageService } from '../../../service/storage.service';
import { environment } from '../../../../environments/environment.development';

const COL_EVENTS = environment.collection.EVENTS;

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCreateComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly firebaseService = inject(FirebaseService);
  readonly storageService = inject(StorageService);
  readonly eventService = inject(EventService);
  readonly logService = inject(LogService);

  /* Variables */
  eventId = signal<string | null>(null);
  imagePreview = signal<string | ArrayBuffer | null | undefined>(undefined);
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
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('id');
      this.eventId.set(params.get('id'));
      if (!eventId) return;

      /* Info generali */
      const { props } = await this.eventService.getEventById(eventId);
      this.eventForm.setValue({
        name: props.name,
        description: props.description,
        location: props.location,
        startDate: formatDate(props.startDate, 'yyyy-MM-dd HH:mm:ss', 'it'),
        endDate: formatDate(props.endDate, 'yyyy-MM-dd HH:mm:ss', 'it')
      });

      /* Immagine */
      this.imagePreview.set(props.imageUrl);
    });
  }

  /* ------------------------ Methods ------------------------ */
  protected async addOrUpdateEvent(): Promise<void> {
    if (this.eventForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    const eventId = this.eventId();
    const form = this.eventForm.getRawValue();
    if (eventId) {
      await this.eventService.updateEvent(eventId, form);
    } else {
      /* Creazione evento */
      const eventId = await this.eventService.addEvent(form, null);

      /* Aggiunta image a storage */
      if (this.imageFile()) {
        const imageUrl = await this.storageService.saveImage(this.imageFile()!, COL_EVENTS, eventId);
        await this.eventService.updateEventImageUrl(eventId, imageUrl);
      }
    }
  }
}
