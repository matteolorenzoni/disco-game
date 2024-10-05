import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageReference } from 'firebase/storage';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { environment } from '../../../../environments/environment.development';
import { Doc } from '../../../model/firebase';
import { Event } from '../../../model/event.model';
import { UserGame } from '../../../model/user-game.model';
import { FirebaseService } from '../../../service/firebase.service';
import { EventService } from '../../../service/event.service';
import { StorageService } from '../../../service/storage.service';
import { UserGameService } from '../../../service/user-game.service';
import { UserImageUrlPipe } from '../../../pipe/user-image-url.pipe';

const COL_USERS = environment.collection.USERS;

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FaIconComponent, UserImageUrlPipe],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly firebaseService = inject(FirebaseService);
  readonly storageService = inject(StorageService);
  readonly eventService = inject(EventService);
  readonly userGameService = inject(UserGameService);

  /* Variables */
  event = signal<Doc<Event> | undefined>(undefined);
  teamId = signal<string | null>(null);
  teamUserImageRefs = signal<StorageReference[]>([]);
  userGames = signal<Doc<UserGame>[]>([]);
  userGamesActive = signal<Doc<UserGame> | undefined>(undefined);

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
        this.userGameService.getUserGamesByTeamId(teamId)
      ]);
      this.event.set(event);
      this.userGames.set(userGames.filter((x) => x.props.userId !== userId));
      this.userGamesActive.set(userGames.find((x) => x.props.userId === userId));
      this.teamUserImageRefs.set(userImageRefs.items);
    });
  }
}
