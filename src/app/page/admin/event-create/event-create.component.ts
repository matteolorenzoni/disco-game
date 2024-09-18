import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { endDateValidator } from '../../../util/utils';
import { EventService } from '../../../service/event.service';
import { EventModel, FromMap } from '../../../model/form.model';
import { LogService } from './../../../service/log.service';

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
  readonly eventService = inject(EventService);
  readonly logService = inject(LogService);

  /* Variables */
  eventId = signal<string | null>(null);

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
      imageUrl: new FormControl<string | null>(null),
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

      const { props } = await this.eventService.getEventById(eventId);
      this.eventForm.setValue({
        name: props.name,
        description: props.description,
        location: props.location,
        imageUrl: props.imageUrl,
        startDate: formatDate(props.startDate, 'yyyy-MM-dd HH:mm:ss', 'it'),
        endDate: formatDate(props.endDate, 'yyyy-MM-dd HH:mm:ss', 'it')
      });
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
      await this.eventService.addEvent(form);
    }
  }
}
