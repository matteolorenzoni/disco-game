import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleRight, faCrown } from '@fortawesome/free-solid-svg-icons';
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
  readonly eventTeamUserService = inject(EventTeamUserService);

  /* Variables */
  teamId = signal<string | null>(null);
  teamUserImageRefs = signal<StorageReference[]>([]);
  eventTeamUsers = signal<Doc<EventTeamUser>[]>([]);
  eventTeamUserActive = signal<Doc<EventTeamUser> | undefined>(undefined);
  teamTotalPoints = computed<number>(() =>
    this.eventTeamUsers().reduce((acc, cur) => acc + cur.props.userTotalPoints, 0)
  );

  /* Icons */
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
          const [userImageRefs, eventTeamUsers] = await Promise.all([
            this.storageService.getImageRefsByCollection(COL_USERS),
            this.eventTeamUserService.getEventTeamUsersByProp('teamId', teamId)
          ]);
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
