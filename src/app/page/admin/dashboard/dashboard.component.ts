import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TitleComponent } from '../../../components/title/title.component';
import { LoaderService } from '../../../service/loader.service';
import { UserService } from '../../../service/user.service';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase';
import { EventService } from '../../../service/event.service';
import { TeamService } from '../../../service/team.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TitleComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  /* Services */
  private readonly userService = inject(UserService);
  private readonly eventService = inject(EventService);
  private readonly teamService = inject(TeamService);
  private readonly loaderService = inject(LoaderService);

  /* Variables */
  usersCount = signal<number>(0);
  eventTeamsCounts = signal<{ event: Doc<Event>; count: number }[]>([]);

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    await this.initHttp();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initHttp() {
    await this.loaderService.executeImmediate(async () => {
      const usersCount = await this.userService.getUsersCount();
      this.usersCount.set(usersCount);

      const events = await this.eventService.getAllEvents();
      events.forEach(async (event) => {
        const teamsCount = await this.teamService.getUsersCountByEventId(event.id);
        this.eventTeamsCounts.update((val) => [...val, { event, count: teamsCount }]);
      });
    });
  }
}
