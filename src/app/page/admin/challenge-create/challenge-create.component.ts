import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LogService } from '../../../service/log.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChallengeStatus } from '../../../model/challenge.model';
import { ChallengeModel, FromMap } from '../../../model/form.model';
import { ChallengeService } from '../../../service/challenge.service';

@Component({
  selector: 'app-challenge-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './challenge-create.component.html',
  styleUrls: ['./challenge-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeCreateComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);
  readonly challengeService = inject(ChallengeService);
  readonly logService = inject(LogService);

  /* Variables */
  challengeId = signal<string | null>(null);

  /* Constants */
  challengeStatuses = Object.values(ChallengeStatus);

  /* Form */
  challengeForm = new FormGroup<FromMap<ChallengeModel>>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)]
    }),
    rules: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    points: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    status: new FormControl<ChallengeStatus>(ChallengeStatus.ACTIVE, {
      nonNullable: true,
      validators: [Validators.required]
    }),
    complexity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)]
    }),
    startDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    endDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => {
      const challengeId = params.get('id');
      if (!challengeId) return;

      this.challengeId.set(params.get('id'));
      const { props } = await this.challengeService.getChallengeById(challengeId);
      this.challengeForm.setValue({
        name: props.name,
        description: props.description,
        rules: props.rules,
        points: props.points,
        complexity: props.complexity,
        status: props.status,
        startDate: formatDate(props.startDate, 'yyyy-MM-dd HH:mm:ss', 'it'),
        endDate: formatDate(props.endDate, 'yyyy-MM-dd HH:mm:ss', 'it')
      });
    });
  }

  /* ------------------------ Methods ------------------------ */
  protected async addOrUpdateChallenge(): Promise<void> {
    if (this.challengeForm.invalid) return;

    const challengeId = this.challengeId();
    const form = this.challengeForm.getRawValue();
    if (challengeId) {
      await this.challengeService.updateChallenge(challengeId, form);
    } else {
      await this.challengeService.addChallenge(form);
    }
  }
}
