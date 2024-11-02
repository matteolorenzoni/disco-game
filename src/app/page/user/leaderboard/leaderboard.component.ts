import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TitleComponent } from '../../../components/title/title.component';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase';
import { EventService } from '../../../service/event.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { IndexedDbService } from '../../../service/indexed-db.service';
import { LeaderboardService } from '../../../service/leadeboard.service';
import { Team } from '../../../model/team.model';
import { LogService } from '../../../service/log.service';
import { LoaderService } from '../../../service/loader.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, TitleComponent, FaIconComponent],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  /* Services */
  private readonly eventService = inject(EventService);
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly dbService = inject(IndexedDbService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Variable */
  mode = signal<'live' | 'general'>('live');
  events = signal<Doc<Event>[] | undefined>(undefined);
  eventSelected = signal<Doc<Event> | undefined>(undefined);
  teamsTop10 = signal<Doc<Team>[]>([]);
  teamsTotal = signal<Doc<Team>[]>([]);
  teams = computed(() => {
    const teams = this.mode() === 'live' ? this.teamsTop10() : this.teamsTotal();
    const podium = teams.slice(0, 3);
    const otherTeams = teams.slice(3);
    return {
      podium: { first: podium[0], second: podium[1], third: podium[2] },
      otherTeams
    };
  });
  secondsLeft = signal<number | undefined>(undefined);

  /* Ref */
  unsubscribe?: () => void;
  timeout?: ReturnType<typeof setTimeout>;

  /* Icons */
  ICON_LEFT = faArrowLeft;
  ICON_RIGHT = faArrowRight;

  /* ---------------------- Constructor ---------------------- */
  constructor() {
    /* Aggiorno ad ogni cambiamento di evento o mode */
    effect(
      async () => {
        const eventSelected = this.eventSelected();
        const mode = this.mode();
        if (!eventSelected) return;

        this.resetObservableAndTimer();

        if (mode === 'live') {
          // Ottengo il live delle prime 10 squadre
          this.subscribeLeaderboard(eventSelected.id);
        } else {
          // Ottengo tutte le squadre (una volta al minuto)
          await this.getLeaderboardEveryMinute(eventSelected.id);
        }
      },
      { allowSignalWrites: true }
    );
  }

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    /* Inizializzazione indexedDB */
    await this.initIndexedDb();

    /* Inizializzazione http */
    await this.initHttp();
  }

  ngOnDestroy(): void {
    this.resetObservableAndTimer();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initIndexedDb() {
    const events = await this.dbService.getEvents();
    this.events.set(events);
    this.eventSelected.set(events[0]);
    if (!events[0]) return;

    const leaderboard = await this.dbService.getLeaderboardByEventId(events[0].id);
    this.teamsTotal.set(leaderboard);
  }

  private async initHttp() {
    await this.loaderService.executeWithDelay(async () => {
      const events = await this.eventService.getActiveEvents();
      this.events.set(events);
      this.eventSelected.set(events[0]);

      /* Aggiorno il indexedDB */
      this.dbService.saveEvents(events);
    });
  }

  /* -------------------- Methods: firebase -------------------- */
  private async getLeaderboardEveryMinute(eventId: string): Promise<void> {
    const leaderboard = await this.dbService.getLeaderboardByEventId(eventId);
    this.teamsTotal.set(leaderboard);

    // Attivo l'intervallo
    this.timeout = setInterval(async () => {
      await this.loaderService.executeImmediate(async () => {
        const now = new Date();
        const seconds = now.getSeconds();
        this.secondsLeft.set(60 - seconds);
        if (seconds !== 0) return;

        const teams = await this.leaderboardService.getActiveTeamsByEventId(eventId);
        this.teamsTotal.set(teams);
        this.dbService.saveLeaderboard(teams); // Aggiorno il indexedDB
        this.logService.addLogConfirm('Classifica aggiornata');
      });
    }, 1000);
  }

  private subscribeLeaderboard(eventId: string): void {
    this.unsubscribe = this.leaderboardService.subscribeToActiveTeamsByEventIdTop10(eventId, (teams) => {
      this.teamsTop10.set(teams);
    });
  }

  /* -------------------- Methods event -------------------- */
  protected onArrowClick(index: -1 | 1): void {
    this.resetTeams();

    const events = this.events()!;
    const currentIndex = events.indexOf(this.eventSelected()!);
    const newIndex = (currentIndex + index + events.length) % events.length;
    this.eventSelected.set(events[newIndex]);
  }

  /* -------------------- Methods util -------------------- */
  private resetTeams(): void {
    this.teamsTop10.set([]);
    this.teamsTotal.set([]);
  }

  private resetObservableAndTimer(): void {
    // Interrompo subscribe di liveTop10 e timer di general
    if (this.unsubscribe) this.unsubscribe();
    if (this.timeout) clearInterval(this.timeout);
    this.secondsLeft.set(undefined);
  }
}
