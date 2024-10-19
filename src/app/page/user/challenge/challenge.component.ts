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
import { QRCodeModule } from 'angularx-qrcode';
import { FirebaseService } from '../../../service/firebase.service';

@Component({
  selector: 'app-challenge',
  standalone: true,
  imports: [
    CommonModule,
    TitleComponent,
    FaIconComponent,
    FvCountdownComponent,
    FvChallengeStatusComponent,
    FvRatingComponent,
    QRCodeModule
  ],
  templateUrl: './challenge.component.html',
  styleUrls: ['./challenge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly httpService = inject(HttpService);
  readonly firebaseService = inject(FirebaseService);
  readonly challengeService = inject(ChallengeService);
  readonly eventChallengeService = inject(EventChallengeService);

  /* Variables */
  challenge = signal<Doc<Challenge> | undefined>(undefined);
  eventChallenge = signal<Doc<EventChallenge> | undefined>(undefined);
  qrdata = signal<string | undefined>('');

  /* Icons */
  ICON_INFINITY = faInfinity;

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(
      async (params) =>
        await this.httpService.execute(async () => {
          const userId = this.firebaseService.userFirebase()?.uid;
          const eventId = params.get('eventId');
          const challengeId = params.get('challengeId');
          if (!userId || !eventId || !challengeId) throw new Error('retry', { cause: 'retry' });

          /* Ottengo i dati della sfida e quelli della sfida applicati a questo evento */
          const [challenge, eventChallenge] = await Promise.all([
            this.challengeService.getChallengeById(challengeId),
            this.eventChallengeService.getEventChallengeByIds(eventId, challengeId)
          ]);
          this.challenge.set(challenge);
          this.eventChallenge.set(eventChallenge);

          /* Genero qrcode */
          const qrcode = { eventId, challengeId, userId };
          this.qrdata.set(JSON.stringify(qrcode));
        })
    );
  }
}
