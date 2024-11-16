import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TitleComponent } from '../../../components/title/title.component';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../../service/loader.service';
import { TeamService } from '../../../service/team.service';
import { Doc } from '../../../model/firebase';
import { Team, TeamStatus } from '../../../model/team.model';
import EventTeamStatus from './team-status.config.json';
import { SelectOption } from '../../../components/fv-select.component';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../../service/log.service';

@Component({
  selector: 'app-event-team',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleComponent],
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
  pointsToUpdate: number | null = null;

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
  public async updateTeamPoints(operation: 'ADD' | 'REMOVE', team: Doc<Team>): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      /* Check numero */
      if (this.pointsToUpdate === null) {
        this.logService.addLogErrorApp('Inserire un valore');
        return;
      }

      /* Check numero positivo */
      if (this.pointsToUpdate < 1) {
        this.logService.addLogErrorApp('Inserire un valore positivo');
        return;
      }

      /* Aggiorno squadra */
      const totalPoints = team.props.totalPoints + (operation === 'ADD' ? this.pointsToUpdate : -this.pointsToUpdate);
      await this.teamService.updateProps([team.id], { totalPoints });
      this.teams.update((val) => val.map((x) => (x.id === team.id ? { ...x, props: { ...x.props, totalPoints } } : x)));

      /* Log */
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
    this.pointsToUpdate = null;
    this.teamSelected.update((val) => (val?.id === team.id ? undefined : team));
  }
}
