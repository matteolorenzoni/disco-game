import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { EventChallenge } from '../../../model/event-challenge.model';
import { Doc } from '../../../model/firebase';
import { ActivatedRoute } from '@angular/router';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { User } from '../../../model/user.model';
import { UserService } from '../../../service/user.service';

@Component({
  selector: 'app-user-team',
  standalone: true,
  imports: [CommonModule],
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
  user = signal<Doc<User> | undefined>(undefined);
  eventChallenges = signal<Doc<EventChallenge>[]>([]);

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    // Recupera l'ID dell'evento dalla route
    this.route.paramMap.subscribe(async (params) => {
      const userId = params.get('userId');
      const eventId = params.get('eventId');
      if (!userId || !eventId) throw new Error('retry', { cause: 'retry' });

      /* Ottengo le info dell'utente selezionato */
      const user = await this.userService.getUserById(userId);
      this.user.set(user);

      /* Ottengo tutte le sfide per questo evento */
      const eventChallenge = await this.eventChallengeService.getEventChallengesByEventId(eventId);
      console.log(eventChallenge);
      this.eventChallenges.set(eventChallenge);
    });
  }
}
