import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase';
import { EventService } from '../../../service/event.service';
import { FvFloatingButtonComponent } from '../../../components/fv-floating-button.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { FvButtonOutlinedComponent } from '../../../components/fv-button-outlined.component';
import { TitleComponent } from '../../../components/title/title.component';
import { LoaderService } from '../../../service/loader.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPeopleGroup } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    TitleComponent,
    FvButtonComponent,
    FvButtonOutlinedComponent,
    FvFloatingButtonComponent
  ],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit {
  /* Services */
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly loaderService = inject(LoaderService);

  /* Variables */
  events = signal<Doc<Event>[] | undefined>(undefined);

  /* Icons */
  ICON_TEAM = faPeopleGroup;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    await this.initHttp();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initHttp() {
    await this.loaderService.executeWithDelay(async () => {
      const events = await this.eventService.getAllEvents();
      this.events.set(events);
    });
  }

  /* -------------------- Methods -------------------- */
  protected async goToUpdateEvent(eventId: string): Promise<void> {
    await this.router.navigate([`admin/events/${eventId}`]);
  }

  protected async goToUpdateEventChallenges(eventId: string): Promise<void> {
    await this.router.navigate([`admin/events/${eventId}/challenges`]);
  }

  protected async goToUpdateEventTeams(eventId: string): Promise<void> {
    await this.router.navigate([`admin/events/${eventId}/teams`]);
  }

  protected async executeFloatingButton(): Promise<void> {
    await this.router.navigateByUrl('admin/events/new');
  }
}
