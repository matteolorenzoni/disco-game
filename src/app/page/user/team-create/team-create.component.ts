import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { TeamService } from '../../../service/team.service';
import { FromMap, NewTeamModel } from '../../../model/form.model';

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
  readonly teamService = inject(TeamService);

  /* Variables */
  teamId = signal<string | null>(null);

  /* Form */
  teamForm = new FormGroup<FromMap<NewTeamModel>>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)]
    })
    // description: new FormControl('', {
    //   nonNullable: true,
    //   validators: [Validators.required, Validators.maxLength(500)]
    // })
  });

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => {
      const teamId = params.get('teamId');
      this.teamId.set(teamId);
      if (!teamId) return;

      const { props } = await this.teamService.getTeamById(teamId);
      this.teamForm.setValue({
        name: props.name
      });
    });
  }

  /* ------------------------ Methods ------------------------ */
  protected async updateTeam(): Promise<void> {
    if (this.teamForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    const teamId = this.teamId();
    if (!teamId) throw new Error('retry', { cause: 'retry' });

    const form = this.teamForm.getRawValue();
    await this.teamService.updateTeam(teamId, form);
  }
}
