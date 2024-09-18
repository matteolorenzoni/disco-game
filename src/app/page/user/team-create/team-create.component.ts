import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LogService } from '../../../service/log.service';
import { TeamService } from '../../../service/team.service';
import { FromMap, TeamModel } from '../../../model/form.model';
import { UserService } from '../../../service/user.service';

@Component({
  selector: 'app-team-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './team-create.component.html',
  styleUrls: ['./team-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamCreateComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly userService = inject(UserService);
  readonly teamService = inject(TeamService);
  readonly logService = inject(LogService);

  /* Variables */
  eventId = signal<string | null>(null);
  teamId = signal<string | null>(null);

  /* Form */
  teamForm = new FormGroup<FromMap<TeamModel>>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)]
    }),
    imageUrl: new FormControl<string | null>(null)
  });

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => {
      const eventId = params.get('eventId');
      this.eventId.set(eventId);
      if (!eventId) throw new Error('retry', { cause: 'retry' });

      const teamId = params.get('teamId');
      this.teamId.set(teamId);
      if (!teamId) return;

      const { props } = await this.teamService.getTeamById(teamId);
      this.teamForm.setValue({
        name: props.name,
        description: props.description,
        imageUrl: props.imageUrl
      });
    });
  }

  /* ------------------------ Methods ------------------------ */
  protected async addOrUpdateTeam(): Promise<void> {
    if (this.teamForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    const userId = this.userService.userId();
    const user = await this.userService.user();
    const eventId = this.eventId();
    if (!userId || !user || !eventId) throw new Error('retry', { cause: 'retry' });

    const teamId = this.teamId();
    const form = this.teamForm.getRawValue();
    if (teamId) {
      await this.teamService.updateTeam(teamId, form);
    } else {
      await this.teamService.addTeam(userId, user.defaultCode, eventId, form);
    }
  }
}
