import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { EventChallenge } from '../../../model/event-challenge.model';
import { Doc } from '../../../model/firebase';
import { ActivatedRoute } from '@angular/router';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { User } from '../../../model/user.model';
import { UserService } from '../../../service/user.service';
import { TitleComponent } from '../../../components/title/title.component';

@Component({
  selector: 'app-user-team',
  standalone: true,
  imports: [CommonModule, TitleComponent],
  templateUrl: './user-team.component.html',
  styleUrls: ['./user-team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTeamComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly userService = inject(UserService);
  readonly eventChallengeService = inject(EventChallengeService);

  /* Variables */
  teamId = signal<string | undefined>(undefined);
  user = signal<Doc<User> | undefined>(undefined);
  eventChallenges = signal<Doc<EventChallenge>[]>([]);

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    // Recupera l'ID dell'evento dalla route
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('eventId');
      const teamId = params.get('teamId');
      const userId = params.get('userId');
      if (!eventId || !teamId || !userId) throw new Error('retry', { cause: 'retry' });

      /* Squadra */
      this.teamId.set(teamId);

      /* Compagno */
      const user = await this.userService.getUserById(userId);
      this.user.set(user);

      /* Ottengo tutte le sfide per questo evento */
      const eventChallenge = await this.eventChallengeService.getEventChallengesByEventId(eventId);
      this.eventChallenges.set(eventChallenge);
    });
  }
}
