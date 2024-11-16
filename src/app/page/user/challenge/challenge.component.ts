import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { Doc } from '../../../model/firebase';
import { Challenge } from '../../../model/challenge.model';
import { ChallengeStatus, EventChallenge, Qrcode } from '../../../model/event-challenge.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';
import { FvChallengeStatusComponent } from '../../../components/fv-challenge-status.component';
import { FvCountdownComponent } from '../../../components/fv-countdown.component';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { TitleComponent } from '../../../components/title/title.component';
import { QRCodeModule } from 'angularx-qrcode';
import { FirebaseService } from '../../../service/firebase.service';
import { LoaderService } from '../../../service/loader.service';

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
  private readonly route = inject(ActivatedRoute);
  private readonly firebaseService = inject(FirebaseService);
  private readonly challengeService = inject(ChallengeService);
  private readonly eventChallengeService = inject(EventChallengeService);
  private readonly loaderService = inject(LoaderService);

  /* Params */
  EVENT_ID = this.route.snapshot.paramMap.get('eventId');
  TEAM_ID = this.route.snapshot.paramMap.get('teamId');
  CHALLENGE_ID = this.route.snapshot.paramMap.get('challengeId');

  /* Variables */
  challengeMerged = signal<{ challenge: Doc<Challenge>; eventChallenge: Doc<EventChallenge> } | undefined>(undefined);
  qrdata = signal<string | undefined>(undefined);

  /* Enum */
  CHALLENGE_STATUS = ChallengeStatus;

  /* Icons */
  ICON_INFINITY = faInfinity;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    /* Inizializzazione http */
    await this.initHttp();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initHttp() {
    await this.loaderService.executeWithDelay(async () => {
      const userId = this.firebaseService.userFirebase()?.uid;
      if (!userId || !this.EVENT_ID || !this.TEAM_ID || !this.CHALLENGE_ID)
        throw new Error('retry', { cause: 'retry' });

      /* Ottengo i dati della sfida e quelli della sfida applicati a questo evento */
      const [challenge, eventChallenge] = await Promise.all([
        this.challengeService.getChallengeById(this.CHALLENGE_ID),
        this.eventChallengeService.getEventChallengeById(this.EVENT_ID, this.CHALLENGE_ID)
      ]);
      this.challengeMerged.set({ challenge, eventChallenge });

      /* Genero qrcode */
      const qrcode: Qrcode = {
        teamId: this.TEAM_ID,
        userId,
        challengeId: this.CHALLENGE_ID,
        points: challenge.props.points
      };
      this.qrdata.set(JSON.stringify(qrcode));
    });
  }
}
