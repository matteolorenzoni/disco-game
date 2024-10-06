import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase';
import { EventService } from '../../../service/event.service';
import { FvFloatingButtonComponent } from '../../../components/fv-floating-button.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendar, faClock, faLocationPin } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FaIconComponent, FvFloatingButtonComponent],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly eventService = inject(EventService);

  /* Variables */
  events = signal<Doc<Event>[]>([]);
  eventIdSelected = signal<string | undefined>(undefined);

  /* Icons */
  ICON_CALENDAR = faCalendar;
  ICON_CLOCK = faClock;
  ICON_LOCATION = faLocationPin;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    const events = await this.eventService.getEvents();
    this.events.set(events);
    this.eventIdSelected.set(events[0].id);
  }

  /* -------------------- Methods -------------------- */
  protected async goToUpdateEvent(eventId: string): Promise<void> {
    await this.router.navigate([`admin/events/${eventId}`]);
  }

  protected async goToUpdateEventChallenges(eventId: string): Promise<void> {
    await this.router.navigate([`admin/events/${eventId}/challenges`]);
  }

  protected async executeFloatingButton(): Promise<void> {
    await this.router.navigateByUrl('admin/events/new');
  }
}
