import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { ChallengeModel, FromMap } from '../../../model/form.model';
import { Challenge, ChallengeType } from '../../../model/challenge.model';
import { ChallengeService } from '../../../service/challenge.service';
import { LogService } from '../../../service/log.service';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { FvTextAeraComponent } from '../../../components/fv-text-area.component';
import { TitleComponent } from '../../../components/title/title.component';
import ChallengeTypes from './challenge-type.config.json';
import { LoaderService } from '../../../service/loader.service';
import { trimFormValues } from '../../../util/utils';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { ChallengeStatus } from '../../../model/event-challenge.model';
import { Doc } from '../../../model/firebase';
import { splitByDate } from '../../../util/merge.util';
import { EventService } from '../../../service/event.service';

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
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly eventService = inject(EventService);
  private readonly challengeService = inject(ChallengeService);
  private readonly eventChallengeService = inject(EventChallengeService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Constants */
  OPTIONS = ChallengeTypes as SelectOption[];

  /* Variables */
  challenge = signal<Doc<Challenge> | null | undefined>(undefined);
  challengeTypeModalIsOpen = signal<boolean>(false);
  challengeTypeActive = signal<SelectOption>(this.OPTIONS.find((x) => x.icon === ChallengeType.ALBERO)!);

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
    type: new FormControl(ChallengeType.ALBERO, {
      nonNullable: true,
      validators: [Validators.required]
    }),
    points: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.pattern('^(0|[1-9][0-9]*)$')]
    }),
    complexity: new FormControl(1, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(1),
        Validators.max(5),
        Validators.pattern('^(?:[1-4](?:\\.\\d+)?|5(?:\\.0+)?)$')
      ]
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
      const challengeId = params.get('challengeId');
      if (!challengeId) {
        this.challenge.set(null);
        return;
      }

      const challenge = await this.challengeService.getChallengeById(challengeId);
      this.challenge.set(challenge);
      this.challengeForm.patchValue(challenge.props);
    });
  }

  /* ------------------------ Methods: firebase ------------------------ */
  protected async addOrUpdateChallenge(): Promise<void> {
    if (this.challengeForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    await this.loaderService.executeImmediate(async () => {
      const form = trimFormValues(this.challengeForm.getRawValue());

      /* Aggiungo o aggiorno il documento */
      const challenge = this.challenge();
      if (!challenge) {
        // Creo sfida
        await this.challengeService.add(form);
      } else {
        // Aggiorno sfida
        const isNewName = challenge.props.name !== form.name;
        const isNewType = challenge.props.type !== form.type;

        /* Aggiorno sfida */
        await this.challengeService.update(challenge.id, form);

        /* Aggiorno eventChallenge collegati alla sfida */
        if (isNewName || isNewType) {
          const eventChallenges = await this.eventChallengeService.getEventChallengesByProp([
            { key: 'challengeId', value: challenge.id }
          ]);
          await Promise.all([
            this.eventChallengeService.updateProps(
              eventChallenges.map((x) => x.id),
              { challengeName: form.name, challengeType: form.type }
            ),
            this.eventService.updateProps(
              eventChallenges.map((x) => x.props.eventId),
              {}
            )
          ]);
        }
      }

      /* Torno indietro */
      this.location.back();

      /* Log */
      this.logService.addLogConfirm(challenge ? 'Sfida aggiornata' : 'Sfida aggiunta');
    });
  }

  protected async deleteChallenge(challengeId: string): Promise<void> {
    const userConfirm = confirm('Sei sicuro di voler eliminare la sfida?');
    if (!userConfirm) return;

    await this.loaderService.executeImmediate(async () => {
      /* Elimina la sfida */
      await this.challengeService.softDelete(challengeId);

      /* Elimina tutti gli eventChallenge associati a quella sfida oppure li marco come ban (in base alla data di evento) */
      const eventChallenges = await this.eventChallengeService.getEventChallengesByProp([
        { key: 'challengeId', value: challengeId }
      ]);
      const mergeEventsSplitted = splitByDate(eventChallenges, 'eventStartDate');
      await Promise.all([
        this.eventChallengeService.delete(mergeEventsSplitted.future.map((x) => x.id)),
        this.eventChallengeService.updateProps(
          mergeEventsSplitted.past.map((x) => x.id),
          { status: ChallengeStatus.CHALLENGE_DELETED }
        ),
        this.eventService.updateProps(
          eventChallenges.map((x) => x.props.eventId),
          {}
        )
      ]);

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
    this.challengeForm.patchValue({ type: challengeType });
    this.challengeTypeModalIsOpen.set(false);
  }
}
