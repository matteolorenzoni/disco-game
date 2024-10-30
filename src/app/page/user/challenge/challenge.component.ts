import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { Doc } from '../../../model/firebase';
import { Challenge } from '../../../model/challenge.model';
import { EventChallenge, Qrcode } from '../../../model/event-challenge.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';
import { FvChallengeStatusComponent } from '../../../components/fv-challenge-status.component';
import { FvCountdownComponent } from '../../../components/fv-countdown.component';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { TitleComponent, TitlePageItem } from '../../../components/title/title.component';
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
  private readonly route = inject(ActivatedRoute);
  private readonly firebaseService = inject(FirebaseService);
  private readonly challengeService = inject(ChallengeService);
  private readonly eventChallengeService = inject(EventChallengeService);

  /* Variables */
  pages = signal<TitlePageItem[]>([]);
  eventId = signal<string | undefined>(undefined);
  teamId = signal<string | undefined>(undefined);
  challengeMerged = signal<{ challenge: Doc<Challenge>; eventChallenge: Doc<EventChallenge> } | undefined>(undefined);
  qrdata = signal<string | undefined>(undefined);

  /* Icons */
  ICON_INFINITY = faInfinity;

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('eventId');
      const teamId = params.get('teamId');
      const userId = this.firebaseService.userFirebase()?.uid;
      const challengeId = params.get('challengeId');
      if (!eventId || !teamId || !userId || !challengeId) throw new Error('retry', { cause: 'retry' });

      /* Pages */
      this.pages.set([
        { path: '../../../../events', label: 'Eventi' },
        ...(teamId !== '_' ? [{ path: `../../../../events/${eventId}/${teamId}`, label: 'Squadra' }] : []),
        { path: '', label: 'Sfida' }
      ]);

      /* Event */
      this.eventId.set(eventId);

      /* Team */
      this.teamId.set(teamId === '_' ? undefined : teamId);

      /* Ottengo i dati della sfida e quelli della sfida applicati a questo evento */
      const [challenge, eventChallenge] = await Promise.all([
        this.challengeService.getChallengeById(challengeId),
        this.eventChallengeService.getEventChallengeById(eventId, challengeId)
      ]);
      this.challengeMerged.set({ challenge, eventChallenge });

      /* Genero qrcode */
      const qrcode: Qrcode = {
        teamId,
        userId,
        challengeId,
        points: challenge.props.points
      };
      this.qrdata.set(JSON.stringify(qrcode));
    });
  }
}
