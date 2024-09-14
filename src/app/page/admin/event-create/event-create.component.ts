import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { endDateValidator } from '../../../util/utils';
import { FirebaseEventService } from '../../../service/firebase-event.service';
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
  readonly firebaseEventService = inject(FirebaseEventService);
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
      startDate: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      endDate: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      location: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(200)]
      }),
      imageUrl: new FormControl<string | null>(null),
      isActive: new FormControl(true, {
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
      if (!eventId) return;

      this.eventId.set(params.get('id'));
      const { props } = await this.firebaseEventService.getEventById(eventId);
      this.eventForm.setValue({
        name: props.name,
        description: props.description,
        startDate: formatDate(props.startDate, 'yyyy-MM-dd HH:mm:ss', 'it'),
        endDate: formatDate(props.endDate, 'yyyy-MM-dd HH:mm:ss', 'it'),
        location: props.location,
        imageUrl: props.imageUrl,
        isActive: props.isActive
      });
    });
  }

  /* ------------------------ Methods ------------------------ */
  protected async addOrUpdateEvent(): Promise<void> {
    if (this.eventForm.invalid) return;

    const eventId = this.eventId();
    if (eventId) {
      await this.firebaseEventService.updateEvent(eventId, this.eventForm.getRawValue());
    } else {
      await this.firebaseEventService.addEvent(this.eventForm.getRawValue());
    }
  }
}
