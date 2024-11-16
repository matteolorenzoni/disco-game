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
import { LoaderService } from '../../../service/loader.service';

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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly teamService = inject(TeamService);
  private readonly eventChallengeService = inject(EventChallengeService);
  private readonly loaderService = inject(LoaderService);

  /* Params */
  EVENT_ID = this.route.snapshot.paramMap.get('eventId');
  TEAM_ID = this.route.snapshot.paramMap.get('teamId');
  TEAMMATE_ID = this.route.snapshot.paramMap.get('teammateId');

  /* Variables */
  teammate = signal<Doc<User> | undefined>(undefined);
  mergedChallenges = signal<{ eventChallenge: Doc<EventChallenge>; teamUser: TeamUser | undefined }[]>([]);

  /* Enum */
  ChallengeStatus = ChallengeStatus;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    // Recupera l'ID dell'evento dalla route
    await this.initHttp();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initHttp() {
    this.loaderService.executeWithDelay(async () => {
      if (!this.EVENT_ID || !this.TEAM_ID || !this.TEAMMATE_ID) throw new Error('retry', { cause: 'retry' });

      /* Compagno */
      const teammate = await this.userService.getUserById(this.TEAMMATE_ID);
      this.teammate.set(teammate);

      /* Ottengo tutte le sfide di questo evento */
      /* Ottengo ottengo le sfide superate dall'utente per questo evento */
      const [team, eventChallenges] = await Promise.all([
        this.teamService.getTeamById(this.TEAM_ID),
        this.eventChallengeService.getEventChallengesByProp([{ key: 'eventId', value: this.EVENT_ID }])
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
    if (!this.EVENT_ID || !this.TEAM_ID) throw new Error('retry', { cause: 'retry' });

    await this.router.navigate([`user/events/${this.EVENT_ID}/team/${this.TEAM_ID}/challenge/${challengeId}`]);
  }
}
