import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { EventService } from '../../../service/event.service';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase.model';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule],
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit {
  /* Services */
  readonly eventService = inject(EventService);

  /* Variables */
  events = signal<Doc<Event>[]>([]);
  eventIdSelected = signal<string | undefined>(undefined);

  async ngOnInit(): Promise<void> {
    const events = await this.eventService.getEvents();
    this.events.set(events);
    this.eventIdSelected.set(events[0].id);
  }
}
