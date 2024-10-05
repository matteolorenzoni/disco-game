import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LogService } from '../../../service/log.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChallengeModel, FromMap } from '../../../model/form.model';
import { ChallengeService } from '../../../service/challenge.service';
import { ChallengeType } from '../../../model/challenge.model';

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
  challengeTypes = Object.values(ChallengeType);

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
    type: new FormControl(ChallengeType.FROG, {
      nonNullable: true,
      validators: [Validators.required]
    }),
    points: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    maxTimes: new FormControl(null, {
      validators: [Validators.min(1)]
    }),
    complexity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)]
    })
  });

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => {
      const challengeId = params.get('id');
      this.challengeId.set(params.get('id'));
      if (!challengeId) return;

      const { props } = await this.challengeService.getChallengeById(challengeId);
      this.challengeForm.setValue(props);
    });
  }

  /* ------------------------ Methods ------------------------ */
  protected async addOrUpdateChallenge(): Promise<void> {
    if (this.challengeForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    console.log(this.challengeForm.getRawValue());

    // const challengeId = this.challengeId();
    // const form = this.challengeForm.getRawValue();
    // if (challengeId) {
    //   await this.challengeService.updateChallenge(challengeId, form);
    // } else {
    //   await this.challengeService.addChallenge(form);
    // }
  }
}
