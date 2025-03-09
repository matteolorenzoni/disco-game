import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { SelectOption } from '../../../components/fv-select.component';
import { TitleComponent } from '../../../components/title/title.component';
import { Doc } from '../../../model/firebase';
import { Team, TeamStatus } from '../../../model/team.model';
import { LoaderService } from '../../../service/loader.service';
import { LogService } from '../../../service/log.service';
import { TeamService } from '../../../service/team.service';
import EventTeamStatus from './team-status.config.json';

@Component({
  selector: 'app-event-team',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent, TitleComponent],
  templateUrl: './event-team.component.html',
  styleUrls: ['./event-team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventTeamComponent implements OnInit {
  /* Services */
  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Params */
  EVENT_ID = this.route.snapshot.paramMap.get('eventId');

  /* Variables */
  teams = signal<Doc<Team>[]>([]);
  teamSelected = signal<Doc<Team> | undefined>(undefined);

  /* Constants */
  OPTIONS = EventTeamStatus as SelectOption<TeamStatus>[];

  /* Enum */
  TEAM_STATUS = TeamStatus;

  /* Form */
  bonusPoints = signal<number>(0);
  updatePoints = signal<number | null>(null);

  /* Icon */
  ICON_REFRESH = faRefresh;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    /* Inizializzazione http */
    await this.initHttp();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initHttp() {
    await this.loaderService.executeWithDelay(async () => {
      if (!this.EVENT_ID) throw new Error('retry', { cause: 'retry' });

      /* Ottengo le squadre che fanno parte dell'evento */
      const teams = await this.teamService.getActiveTeamsByEventId(this.EVENT_ID);
      this.teams.set(teams);
    });
  }

  /* -------------------------- Methods: firebase --------------------------  */
  public async updateTeamBonusPoints(team: Doc<Team>): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      /* Controllo input */
      const bonusPoints = this.inputIsValid(this.bonusPoints());
      if (bonusPoints === null) return;

      /* Aggiorno squadra */
      let totalPoints = team.props.totalPoints - team.props.bonusPoints + bonusPoints;
      totalPoints = totalPoints >= 0 ? totalPoints : 0;
      await this.teamService.updateProps([team.id], { bonusPoints, totalPoints });
      this.teams.update((val) =>
        val.map((x) => (x.id === team.id ? { ...x, props: { ...x.props, bonusPoints, totalPoints } } : x))
      );

      /* Log */
      this.logService.addLogConfirm('Punti aggiornati');
    });
  }

  public async updateTeamPoints(operation: 'ADD' | 'REMOVE', team: Doc<Team>): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      /* Controllo input */
      const updatePoints = this.inputIsValid(this.updatePoints());
      if (updatePoints === null) return;

      /* Aggiorno squadra */
      let totalPoints = team.props.totalPoints + (operation === 'ADD' ? updatePoints : -updatePoints);
      totalPoints = totalPoints >= 0 ? totalPoints : 0;
      await this.teamService.updateProps([team.id], { totalPoints });
      this.teams.update((val) => val.map((x) => (x.id === team.id ? { ...x, props: { ...x.props, totalPoints } } : x)));

      /* Log */
      this.updatePoints.set(null);
      this.logService.addLogConfirm('Punti aggiornati');
    });
  }

  public async updateTeamStatus(event: Event, team: Doc<Team>): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      /* Aggiorno squadra */
      const status = (event.target as HTMLSelectElement).value as TeamStatus;
      await this.teamService.updateProps([team.id], { status });
      this.teams.update((val) => val.map((x) => (x.id === team.id ? { ...x, props: { ...x.props, status } } : x)));

      /* Log */
      this.logService.addLogConfirm('Stato aggiornato');
    });
  }

  /* -------------------------- Methods: event --------------------------  */
  protected onSelectTeam(team: Doc<Team>): void {
    this.bonusPoints.set(team.props.bonusPoints);
    this.updatePoints.set(null);
    this.teamSelected.update((val) => (val?.id === team.id ? undefined : team));
  }

  private inputIsValid(value: number | null): number | null {
    /* Check numero */
    if (value === null) {
      this.logService.addLogErrorApp('Inserire un valore');
      return null;
    }

    /* Check numero positivo */
    if (value < 0) {
      this.logService.addLogErrorApp('Inserire un valore positivo');
      return null;
    }

    return value;
  }
}
