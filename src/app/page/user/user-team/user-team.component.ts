import { EventTeamUser } from './../../../model/event-team-user.model';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ChallengeStatus, EventChallenge } from '../../../model/event-challenge.model';
import { Doc } from '../../../model/firebase';
import { ActivatedRoute, Router } from '@angular/router';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { User } from '../../../model/user.model';
import { UserService } from '../../../service/user.service';
import { TitleComponent } from '../../../components/title/title.component';
import { EventTeamUserService } from '../../../service/event-team-user.service';
import { GetUserTotalPointsPipe } from '../../../pipe/get-user-total-points.pipe';
import { FvChallengeStatusComponent } from '../../../components/fv-challenge-status.component';

@Component({
  selector: 'app-user-team',
  standalone: true,
  imports: [CommonModule, TitleComponent, FvChallengeStatusComponent, GetUserTotalPointsPipe],
  templateUrl: './user-team.component.html',
  styleUrls: ['./user-team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTeamComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly userService = inject(UserService);
  readonly eventTeamUserService = inject(EventTeamUserService);
  readonly eventChallengeService = inject(EventChallengeService);

  /* Variables */
  eventId = signal<string | undefined>(undefined);
  teamId = signal<string | undefined>(undefined);
  user = signal<Doc<User> | undefined>(undefined);
  mergedChallenges = signal<{ eventChallenge: Doc<EventChallenge>; eventTeamUser: Doc<EventTeamUser> | undefined }[]>(
    []
  );

  /* Enum */
  ChallengeStatus = ChallengeStatus;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    // Recupera l'ID dell'evento dalla route
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('eventId');
      const teamId = params.get('teamId');
      const userId = params.get('userId');
      if (!eventId || !teamId || !userId) throw new Error('retry', { cause: 'retry' });

      /* Evento */
      this.eventId.set(eventId);

      /* Squadra */
      this.teamId.set(teamId);

      /* Compagno */
      const user = await this.userService.getUserById(userId);
      this.user.set(user);

      /* Ottengo tutte le sfide di questo evento */
      /* Ottengo ottengo le sfide superate dall'utente per questo evento */
      const [eventChallenges, eventTeamUsers] = await Promise.all([
        this.eventChallengeService.getEventChallengesByProp([{ key: 'eventId', value: eventId }]),
        this.eventTeamUserService.getEventTeamUsersByProp([
          { key: 'eventId', value: eventId },
          { key: 'teamId', value: teamId },
          { key: 'userId', value: userId }
        ])
      ]);

      /* Metto insieme i dati */
      const mergedChallenges = eventChallenges.map((eventChallenge) => {
        const eventTeamUser = eventTeamUsers.find((user) =>
          user.props.challenges.find((challengeData) => challengeData.challengeId === eventChallenge.props.challengeId)
        );
        return { eventChallenge, eventTeamUser };
      });
      this.mergedChallenges.set(mergedChallenges);
    });
  }

  /* -------------------- Methods -------------------- */
  protected async onGoToChallenge(challengeId: string): Promise<void> {
    const eventId = this.eventId();
    const teamId = this.teamId();
    if (!eventId || !teamId) return;

    await this.router.navigate([`user/challenges/${eventId}/${teamId}/${challengeId}`]);
  }
}
