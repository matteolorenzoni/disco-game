import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendar, faClipboard, faCrown, faLocationPin } from '@fortawesome/free-solid-svg-icons';
import { Doc } from '../../../model/firebase';
import { Event } from '../../../model/event.model';
import { Challenge } from '../../../model/challenge.model';
import { Team } from '../../../model/team.model';
import { EventChallenge } from '../../../model/event-challenge.model';
import { EventService } from '../../../service/event.service';
import { FirebaseService } from '../../../service/firebase.service';
import { TeamService } from '../../../service/team.service';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { TitleComponent } from '../../../components/title/title.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { FvCountdownComponent } from '../../../components/fv-countdown.component';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { LogService } from './../../../service/log.service';
import { FvChallengeStatusComponent } from '../../../components/fv-challenge-status.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TitleComponent,
    FvButtonComponent,
    FvCountdownComponent,
    FvRatingComponent,
    FvChallengeStatusComponent,
    FaIconComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly eventService = inject(EventService);
  readonly teamService = inject(TeamService);
  readonly eventChallengeService = inject(EventChallengeService);
  readonly challengeService = inject(ChallengeService);
  readonly logService = inject(LogService);

  /* Variables */
  event = signal<Doc<Event> | undefined>(undefined);
  team = signal<Doc<Team> | null | undefined>(undefined);
  mergedChallenges = signal<{ challenge: Doc<Challenge>; eventChallenge: Doc<EventChallenge> | undefined }[]>([]);

  /* Constants */
  NOW = new Date();

  /* Icons */
  ICON_CALENDAR = faCalendar;
  ICON_PLACE = faLocationPin;
  ICON_CROWN = faCrown;
  ICON_CLIPBOARD = faClipboard;

  /* -------------------------- Lifecycle hooks --------------------------  */
  async ngOnInit(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    if (!userId) throw new Error('retry', { cause: 'retry' });

    // Recupera le informazioni della partecipazione piu recente
    const team = await this.teamService.getFirstActiveTeamByUserId(userId);

    // Se non è stato trovato alcun utente associato al team, termina l'operazione
    this.team.set(team);
    if (!team) return;

    // Recupera l'evento e le sfide associate all'evento in parallelo
    const [event, eventChallenges] = await Promise.all([
      this.eventService.getEventById(team.props.eventId),
      this.eventChallengeService.getEventChallengesByProp([{ key: 'eventId', value: team.props.eventId }])
    ]);
    this.event.set(event);
    if (!event || !eventChallenges) throw new Error('retry', { cause: 'retry' });

    // Recupera le informazioni dettagliate sulle sfide
    const challenges = await this.challengeService.getChallengesByIds(eventChallenges.map((x) => x.props.challengeId));
    const mergedChallenges = challenges.map((challenge) => {
      const eventChallenge = eventChallenges.find(
        (eventChallenge) => eventChallenge.props.challengeId === challenge.id
      );
      return { challenge, eventChallenge };
    });
    this.mergedChallenges.set(mergedChallenges);
  }

  /* -------------------------- Methods event--------------------------  */
  protected async onGoToTeam(): Promise<void> {
    const team = this.team();
    if (!team) throw new Error('retry', { cause: 'retry' });
    await this.router.navigate([`user/events/${team.props.eventId}/${team.id}`]);
  }

  protected async onGoToChallenge(challengeId: string): Promise<void> {
    const team = this.team();
    if (!team) throw new Error('retry', { cause: 'retry' });
    await this.router.navigate([`user/challenges/${team.props.eventId}/${team.id}/${challengeId}`]);
  }

  protected onCopyCodeToClipboard(): void {
    const team = this.team();
    if (!team) throw new Error('retry', { cause: 'retry' });

    if (!navigator) return;
    navigator.clipboard.writeText(team.props.code);
    this.logService.addLogConfirm('Codice copiato negli appunti');
  }
}
