import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleRight, faArrowDown, faArrowUp, faCrown, faEquals } from '@fortawesome/free-solid-svg-icons';
import { Doc } from '../../../model/firebase';
import { FirebaseService } from '../../../service/firebase.service';
import { TitleComponent } from '../../../components/title/title.component';
import { Team, TeamUser } from '../../../model/team.model';
import { TeamService } from '../../../service/team.service';
import { GetUserTotalPointsPipe } from '../../../pipe/get-user-total-points.pipe';
import { LoaderService } from '../../../service/loader.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FaIconComponent, TitleComponent, GetUserTotalPointsPipe, NgOptimizedImage],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamComponent implements OnInit {
  /* Services */
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly firebaseService = inject(FirebaseService);
  private readonly loaderService = inject(LoaderService);
  private readonly teamService = inject(TeamService);

  /* Variables */
  team = signal<Doc<Team> | undefined>(undefined);
  teammates = signal<TeamUser[]>([]);
  myTeammate = signal<TeamUser | undefined>(undefined);

  /* Icons */
  ICON_UP = faArrowUp;
  ICON_DOWN = faArrowDown;
  ICON_EQUAL = faEquals;
  ICON_CROWN = faCrown;
  ICON_RIGHT = faAngleRight;

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => await this.initHttp(params));
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initHttp(params: ParamMap) {
    await this.loaderService.executeWithDelay(async () => {
      const userId = this.firebaseService.userFirebase()?.uid;
      const eventId = params.get('eventId');
      const teamId = params.get('teamId');
      if (!userId || !eventId || !teamId) throw new Error('retry', { cause: 'retry' });

      /* Ottengo la squadra */
      const team = await this.teamService.getTeamById(teamId);
      this.team.set(team);

      /* Separo le informazioni */
      const teammates = team.props.users.filter((user) => user.id !== userId);
      this.teammates.set(teammates);
      const myTeammate = team.props.users.find((user) => user.id === userId);
      this.myTeammate.set(myTeammate);
    });
  }

  /* ---------------- Methods ---------------- */
  protected goToUserChallenges(userId: string) {
    this.router.navigate([`./`, userId], { relativeTo: this.route });
  }
}
