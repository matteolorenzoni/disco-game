import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { StorageReference } from 'firebase/storage';
import { environment } from '../../../../environments/environment.development';
import { Doc } from '../../../model/firebase';
import { Event } from '../../../model/event.model';
import { UserEventTeam } from '../../../model/user-event-team.model';
import { FirebaseService } from '../../../service/firebase.service';
import { EventService } from '../../../service/event.service';
import { StorageService } from '../../../service/storage.service';
import { UserEventTeamService } from '../../../service/user-event-team.service';
import { UserImageUrlPipe } from '../../../pipe/user-image-url.pipe';
import { TitleComponent } from '../../../components/title/title.component';

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
  readonly eventService = inject(EventService);
  readonly userEventTeamService = inject(UserEventTeamService);

  /* Variables */
  event = signal<Doc<Event> | undefined>(undefined);
  teamId = signal<string | null>(null);
  teamUserImageRefs = signal<StorageReference[]>([]);
  userEventTeams = signal<Doc<UserEventTeam>[]>([]);
  userEventTeamActive = signal<Doc<UserEventTeam> | undefined>(undefined);

  /* Icons */
  ICON_CROWN = faCrown;

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('eventId');
      const teamId = params.get('teamId');
      if (!eventId || !teamId) throw new Error('retry', { cause: 'retry' });

      const userId = this.firebaseService.userFirebase()?.uid;
      const [userImageRefs, event, userGames] = await Promise.all([
        this.storageService.getImageRefsByCollection(COL_USERS),
        this.eventService.getEventById(eventId),
        this.userEventTeamService.getUserEventTeamByProp('teamId', teamId)
      ]);
      this.event.set(event);
      this.userEventTeams.set(userGames.filter((x) => x.props.userId !== userId));
      this.userEventTeamActive.set(userGames.find((x) => x.props.userId === userId));
      this.teamUserImageRefs.set(userImageRefs.items);
    });
  }

  /* ---------------- Methods ---------------- */
  protected goToUserChallenges(userId: string) {
    this.router.navigate([`./`, userId], { relativeTo: this.route });
  }
}
