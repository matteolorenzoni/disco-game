import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpService } from '../../../service/http.service';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { Doc } from '../../../model/firebase';
import { Challenge } from '../../../model/challenge.model';
import { EventChallenge } from '../../../model/event-challenge.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';
import { FvChallengeStatusComponent } from '../../../components/fv-challenge-status.component';
import { FvCountdownComponent } from '../../../components/fv-countdown.component';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { TitleComponent } from '../../../components/title/title.component';

@Component({
  selector: 'app-challenge',
  standalone: true,
  imports: [
    CommonModule,
    TitleComponent,
    FaIconComponent,
    FvCountdownComponent,
    FvChallengeStatusComponent,
    FvRatingComponent
  ],
  templateUrl: './challenge.component.html',
  styleUrls: ['./challenge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly challengeService = inject(ChallengeService);
  readonly eventChallengeService = inject(EventChallengeService);
  readonly httpService = inject(HttpService);

  /* Variables */
  challenge = signal<Doc<Challenge> | undefined>(undefined);
  eventChallenge = signal<Doc<EventChallenge> | undefined>(undefined);

  /* Icons */
  ICON_INFINITY = faInfinity;

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(
      async (params) =>
        await this.httpService.execute(async () => {
          const eventId = params.get('eventId');
          const challengeId = params.get('challengeId');
          if (!eventId || !challengeId) throw new Error('retry', { cause: 'retry' });

          const [challenge, eventChallenge] = await Promise.all([
            this.challengeService.getChallengeById(challengeId),
            this.eventChallengeService.getEventChallengeByIds(eventId, challengeId)
          ]);
          this.challenge.set(challenge);
          this.eventChallenge.set(eventChallenge);
          console.log(challenge);
          console.log(eventChallenge);
        })
    );
  }
}
