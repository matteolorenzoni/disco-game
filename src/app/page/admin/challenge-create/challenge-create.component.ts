import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { ChallengeModel, FromMap } from '../../../model/form.model';
import { ChallengeType } from '../../../model/challenge.model';
import { ChallengeService } from '../../../service/challenge.service';
import { LogService } from '../../../service/log.service';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { FvTextAeraComponent } from '../../../components/fv-text-area.component';
import { TitleComponent } from '../../../components/title/title.component';
import ChallengeTypes from './challenge-type.config.json';
import { LoaderService } from '../../../service/loader.service';

export type SelectOption = {
  label: string;
  icon: ChallengeType;
};

@Component({
  selector: 'app-challenge-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FaIconComponent,
    TitleComponent,
    FvFieldComponent,
    FvTextAeraComponent,
    FvButtonComponent
  ],
  templateUrl: './challenge-create.component.html',
  styleUrls: ['./challenge-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeCreateComponent implements OnInit {
  /* Services */
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly challengeService = inject(ChallengeService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Constants */
  OPTIONS = ChallengeTypes as SelectOption[];

  /* Variables */
  challengeId = signal<string | null>(null);
  challengeTypeModalIsOpen = signal<boolean>(false);
  challengeTypeActive = signal<SelectOption>(this.OPTIONS.find((x) => x.icon === ChallengeType.FROG)!);

  /* Icons */
  ICON_TRASH = faTrash;

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
    complexity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(5)]
    })
  });

  /* ------------------------ Lifecycle hooks ------------------------ */
  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe(async (params) => await this.initHttp(params));

    this.challengeForm.controls.type.valueChanges.subscribe((newValue) => {
      this.challengeTypeActive.set(this.OPTIONS.find((x) => x.icon === newValue)!);
    });
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initHttp(params: ParamMap) {
    this.loaderService.executeWithDelay(async () => {
      const challengeId = params.get('id');
      this.challengeId.set(params.get('id'));
      if (!challengeId) return;

      const { props } = await this.challengeService.getChallengeById(challengeId);
      this.challengeForm.patchValue(props);
    });
  }

  /* ------------------------ Methods: firebase ------------------------ */
  protected async addOrUpdateChallenge(): Promise<void> {
    if (this.challengeForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    await this.loaderService.executeImmediate(async () => {
      /* Aggiungo o aggiorno il documento */
      const challengeId = this.challengeId();
      const form = this.challengeForm.getRawValue();
      if (challengeId) await this.challengeService.updateChallenge(challengeId, form);
      else await this.challengeService.addChallenge(form);

      /* Torno indietro */
      this.location.back();

      /* Log */
      this.logService.addLogConfirm(challengeId ? 'Sfida aggiornata' : 'Sfida aggiunta');
    });
  }

  protected async deleteChallenge(eventChallengeId: string): Promise<void> {
    const userConfirm = confirm('Sei sicuro di voler eliminare la sfida?');
    if (!userConfirm) return;

    await this.loaderService.executeImmediate(async () => {
      /* Elimino il documento */
      await this.challengeService.softDeleteChallenge(eventChallengeId);

      /* Torno indietro */
      this.location.back();

      /* Log */
      this.logService.addLogConfirm('Sfida eliminata');
    });
  }

  /* ------------------------ Methods: utils ------------------------ */
  protected onCloseModal(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.dataset['dialogBackdrop'] === 'sign-in-modal') {
      this.challengeTypeModalIsOpen.set(false);
    }
  }

  protected onSelectType(challengeType: ChallengeType): void {
    this.challengeForm.controls.type.setValue(challengeType);
    this.challengeTypeModalIsOpen.set(false);
  }
}
