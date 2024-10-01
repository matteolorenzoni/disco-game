import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Event } from '../../../model/event.model';
import { EventService } from '../../../service/event.service';
import { Doc } from '../../../model/firebase';
import { UserGame } from '../../../model/user-game.model';
import { UserGameService } from '../../../service/user-game.service';
import { FirebaseService } from '../../../service/firebase.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly firebaseService = inject(FirebaseService);
  readonly eventService = inject(EventService);
  readonly userGameService = inject(UserGameService);

  /* Variables */
  event = signal<Doc<Event> | undefined>(undefined);
  teamId = signal<string | null>(null);
  userGames = signal<Doc<UserGame>[]>([]);
  userGamesActive = signal<Doc<UserGame> | undefined>(undefined);

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('eventId');
      const teamId = params.get('teamId');
      if (!eventId || !teamId) throw new Error('retry', { cause: 'retry' });

      const userId = this.firebaseService.userFirebase()?.uid;
      const [event, userGames] = await Promise.all([
        this.eventService.getEventById(eventId),
        this.userGameService.getUserGamesByTeamId(teamId)
      ]);
      this.event.set(event);
      this.userGames.set(userGames.filter((x) => x.props.userId !== userId));
      this.userGamesActive.set(userGames.find((x) => x.props.userId === userId));
    });
  }
}
