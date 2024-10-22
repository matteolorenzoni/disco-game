import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Doc } from '../../../model/firebase';
import { Event } from '../../../model/event.model';
import { Challenge } from '../../../model/challenge.model';
import { Team } from '../../../model/team.model';
import { EventChallenge } from '../../../model/event-challenge.model';
import { EventTeamUser } from '../../../model/event-team-user.model';
import { EventTeamUserService } from '../../../service/event-team-user.service';
import { EventService } from '../../../service/event.service';
import { FirebaseService } from '../../../service/firebase.service';
import { TeamService } from '../../../service/team.service';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { TitleComponent } from '../../../components/title/title.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { FvCountdownComponent } from '../../../components/fv-countdown.component';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendar, faCrown, faLocationPin } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TitleComponent, FvButtonComponent, FvCountdownComponent, FvRatingComponent, FaIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly eventTeamUserService = inject(EventTeamUserService);
  readonly eventService = inject(EventService);
  readonly teamService = inject(TeamService);
  readonly eventChallengeService = inject(EventChallengeService);
  readonly challengeService = inject(ChallengeService);

  /* Variables */
  eventTeamUser = signal<Doc<EventTeamUser> | null | undefined>(undefined);
  event = signal<Doc<Event> | undefined>(undefined);
  team = signal<Doc<Team> | undefined>(undefined);
  eventChallenges = signal<Doc<EventChallenge>[]>([]);
  challenges = signal<Doc<Challenge>[]>([]);

  /* Constants */
  NOW = new Date();

  /* Icons */
  ICON_CALENDAR = faCalendar;
  ICON_PLACE = faLocationPin;
  ICON_CROWN = faCrown;

  /* -------------------------- Lifecycle hooks --------------------------  */
  async ngOnInit(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    if (!userId) throw new Error('retry', { cause: 'retry' });

    // Recupera le informazioni della partecipazione piu recente
    const eventTeamUser = await this.eventTeamUserService.getMostRecentEventTeamUserByUserId(userId);
    this.eventTeamUser.set(eventTeamUser);

    // Se non è stato trovato alcun utente associato al team, termina l'operazione
    if (!eventTeamUser) return;

    // Recupera l'evento, le sfide associate all'evento e il team a cui l'utente è associato in parallelo
    const [event, eventChallenges, team] = await Promise.all([
      this.eventService.getEventById(eventTeamUser.props.eventId),
      this.eventChallengeService.getEventChallengesByProp([{ key: 'eventId', value: eventTeamUser.props.eventId }]),
      this.teamService.getTeamById(eventTeamUser.props.teamId)
    ]);
    this.event.set(event);
    this.eventChallenges.set(eventChallenges);
    this.team.set(team);
    if (!event || !eventChallenges || !team) throw new Error('retry', { cause: 'retry' });

    // Recupera le informazioni dettagliate sulle sfide
    const challenges = await this.challengeService.getChallengesByIds(eventChallenges.map((x) => x.props.challengeId));
    this.challenges.set(challenges);
  }

  /* -------------------------- Methods event--------------------------  */
  protected async onGoToTeam(): Promise<void> {
    const eventTeamUser = this.eventTeamUser();
    if (!eventTeamUser) throw new Error('retry', { cause: 'retry' });

    const { eventId, teamId } = eventTeamUser.props;
    await this.router.navigate([`user/events/${eventId}/${teamId}`]);
  }

  protected async onGoToChallenge(challengeId: string): Promise<void> {
    const eventTeamUser = this.eventTeamUser();
    if (!eventTeamUser) throw new Error('retry', { cause: 'retry' });

    const { eventId, teamId } = eventTeamUser.props;
    await this.router.navigate([`user/challenges/${eventId}/${teamId}/${challengeId}`]);
  }
}
