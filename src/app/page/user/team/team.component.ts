import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faAngleRight,
  faArrowDown,
  faArrowUp,
  faCrown,
  faEquals,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { StorageReference } from 'firebase/storage';
import { environment } from '../../../../environments/environment';
import { Doc } from '../../../model/firebase';
import { EventTeamUser } from '../../../model/event-team-user.model';
import { FirebaseService } from '../../../service/firebase.service';
import { EventService } from '../../../service/event.service';
import { StorageService } from '../../../service/storage.service';
import { EventTeamUserService } from '../../../service/event-team-user.service';
import { UserImageUrlPipe } from '../../../pipe/user-image-url.pipe';
import { TitleComponent } from '../../../components/title/title.component';
import { HttpService } from '../../../service/http.service';
import { Team } from '../../../model/team.model';
import { TeamService } from '../../../service/team.service';

const COL_USERS = environment.collection.USERS;

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FaIconComponent, TitleComponent, UserImageUrlPipe, NgOptimizedImage],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly firebaseService = inject(FirebaseService);
  readonly storageService = inject(StorageService);
  readonly httpService = inject(HttpService);
  readonly eventService = inject(EventService);
  readonly teamService = inject(TeamService);
  readonly eventTeamUserService = inject(EventTeamUserService);

  /* Variables */
  team = signal<Doc<Team> | undefined>(undefined);
  teamUserImageRefs = signal<StorageReference[]>([]);
  eventTeamUsers = signal<Doc<EventTeamUser>[]>([]);
  eventTeamUserActive = signal<Doc<EventTeamUser> | undefined>(undefined);
  diffPosition = computed<{ value: number; icon: IconDefinition }>(() => {
    const team = this.team();
    if (!team) return { value: 0, icon: this.ICON_EQUAL };
    const value = team.props.lastPosition - team.props.currentPosition;
    if (value > 0) return { value, icon: this.ICON_UP };
    else if (value < 0) return { value, icon: this.ICON_DOWN };
    else return { value, icon: this.ICON_EQUAL };
  });

  /* Icons */
  ICON_UP = faArrowUp;
  ICON_DOWN = faArrowDown;
  ICON_EQUAL = faEquals;
  ICON_CROWN = faCrown;
  ICON_RIGHT = faAngleRight;

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(
      async (params) =>
        await this.httpService.execute(async () => {
          const eventId = params.get('eventId');
          const teamId = params.get('teamId');
          if (!eventId || !teamId) throw new Error('retry', { cause: 'retry' });

          const userId = this.firebaseService.userFirebase()?.uid;
          const [userImageRefs, team, eventTeamUsers] = await Promise.all([
            this.storageService.getImageRefsByCollection(COL_USERS),
            this.teamService.getTeamById(teamId),
            this.eventTeamUserService.getEventTeamUsersByProp('teamId', teamId)
          ]);
          this.team.set(team);
          this.eventTeamUsers.set(eventTeamUsers.filter((x) => x.props.userId !== userId));
          this.eventTeamUserActive.set(eventTeamUsers.find((x) => x.props.userId === userId));
          this.teamUserImageRefs.set(userImageRefs.items);
        })
    );
  }

  /* ---------------- Methods ---------------- */
  protected goToUserChallenges(userId: string) {
    this.router.navigate([`./`, userId], { relativeTo: this.route });
  }
}
