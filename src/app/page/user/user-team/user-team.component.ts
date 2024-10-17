import { EventTeamUser } from './../../../model/event-team-user.model';
import { ChallengeStatus } from './../../../model/event-challenge.model';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { EventChallenge } from '../../../model/event-challenge.model';
import { Doc } from '../../../model/firebase';
import { ActivatedRoute } from '@angular/router';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { User } from '../../../model/user.model';
import { UserService } from '../../../service/user.service';
import { TitleComponent } from '../../../components/title/title.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCirclePause, faLock, faTrash } from '@fortawesome/free-solid-svg-icons';
import { EventTeamUserService } from '../../../service/event-team-user.service';
import { GetUserTotalPointsPipe } from '../../../pipe/get-user-total-points.pipe';

@Component({
  selector: 'app-user-team',
  standalone: true,
  imports: [CommonModule, TitleComponent, FaIconComponent, GetUserTotalPointsPipe],
  templateUrl: './user-team.component.html',
  styleUrls: ['./user-team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTeamComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly userService = inject(UserService);
  readonly eventTeamUserService = inject(EventTeamUserService);
  readonly eventChallengeService = inject(EventChallengeService);

  /* Variables */
  teamId = signal<string | undefined>(undefined);
  user = signal<Doc<User> | undefined>(undefined);
  results = signal<{ eventChallenge: Doc<EventChallenge>; eventTeamUser: Doc<EventTeamUser> | undefined }[]>([]);

  /* Icons */
  ICON_LOCKED = faLock;
  ICON_CANCELED = faTrash;
  ICON_SUSPENDED = faCirclePause;

  /* Enum */
  CHALLENGE_STATUS = ChallengeStatus;

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

      /* Ottengo tutte le sfide superate per questo evento */
      /* Ottengo tutte le info delle sfide*/
      const [eventTeamUsers, eventChallenges] = await Promise.all([
        this.eventTeamUserService.getEventTeamUsersByProp([
          { key: 'eventId', value: eventId },
          { key: 'teamId', value: teamId },
          { key: 'userId', value: userId }
        ]),
        this.eventChallengeService.getEventChallengesByEventId(eventId)
      ]);

      /* Metto insieme i dati */
      const mergedResults = eventChallenges.map((eventChallenge) => {
        const eventTeamUser = eventTeamUsers.find((user) =>
          user.props.challenges.find((challengeData) => challengeData.eventChallengeId === eventChallenge.id)
        );
        return { eventChallenge, eventTeamUser };
      });
      this.results.set(mergedResults);
    });
  }
}
