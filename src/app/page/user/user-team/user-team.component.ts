import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ChallengeStatus, EventChallenge } from '../../../model/event-challenge.model';
import { Doc } from '../../../model/firebase';
import { ActivatedRoute, Router } from '@angular/router';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { User } from '../../../model/user.model';
import { UserService } from '../../../service/user.service';
import { TitleComponent } from '../../../components/title/title.component';
import { GetUserTotalPointsPipe } from '../../../pipe/get-user-total-points.pipe';
import { FvChallengeStatusComponent } from '../../../components/fv-challenge-status.component';
import { TeamService } from '../../../service/team.service';
import { TeamUser } from '../../../model/team.model';

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
  readonly teamService = inject(TeamService);
  readonly eventChallengeService = inject(EventChallengeService);

  /* Variables */
  eventId = signal<string | undefined>(undefined);
  teamId = signal<string | undefined>(undefined);
  teammate = signal<Doc<User> | undefined>(undefined);
  mergedChallenges = signal<{ eventChallenge: Doc<EventChallenge>; teamUser: TeamUser | undefined }[]>([]);

  /* Enum */
  ChallengeStatus = ChallengeStatus;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    // Recupera l'ID dell'evento dalla route
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('eventId');
      const teamId = params.get('teamId');
      const teammateId = params.get('teammateId');
      if (!eventId || !teamId || !teammateId) throw new Error('retry', { cause: 'retry' });

      /* Evento */
      this.eventId.set(eventId);

      /* Squadra */
      this.teamId.set(teamId);

      /* Compagno */
      const teammate = await this.userService.getUserById(teammateId);
      this.teammate.set(teammate);

      /* Ottengo tutte le sfide di questo evento */
      /* Ottengo ottengo le sfide superate dall'utente per questo evento */
      const [team, eventChallenges] = await Promise.all([
        this.teamService.getTeamById(teamId),
        this.eventChallengeService.getEventChallengesByProp([{ key: 'eventId', value: eventId }])
      ]);

      /* Metto insieme i dati */
      const mergedChallenges = eventChallenges.map((eventChallenge) => {
        const teamUser = Array.from(team.props.users.values()).find((user) =>
          user.challenges.some((challengeData) => challengeData.id === eventChallenge.props.challengeId)
        );
        return { eventChallenge, teamUser };
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
