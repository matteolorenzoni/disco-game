/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowsRotate, faCalendar, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { TitleComponent } from '../../../components/title/title.component';
import { FvFieldIconComponent } from '../../../components/fv-field-icon.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { EventService } from '../../../service/event.service';
import { LogService } from '../../../service/log.service';
import { LocalStorageService } from '../../../service/local-storage.service';
import { TeamService } from '../../../service/team.service';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { UserService } from '../../../service/user.service';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase';
import { ChallengeStatus, Qrcode } from '../../../model/event-challenge.model';
import { isEqualQrcode, isQrcode } from '../../../util/type.util';
import { Team } from '../../../model/team.model';
import { LoaderService } from '../../../service/loader.service';
import { trimFormValues } from '../../../util/utils';
import { IndexedDbService } from '../../../service/indexed-db.service';
import { MergeChallenge, mergeChallenges } from '../../../util/merge.util';

type ScanError = {
  message: string;
  code?: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TitleComponent,
    FvFieldIconComponent,
    FvFieldComponent,
    FvButtonComponent,
    FaIconComponent,
    ZXingScannerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  /* Services */
  private readonly userService = inject(UserService);
  private readonly eventService = inject(EventService);
  private readonly teamService = inject(TeamService);
  private readonly challengeService = inject(ChallengeService);
  private readonly eventChallengeService = inject(EventChallengeService);
  private readonly lsService = inject(LocalStorageService);
  private readonly dbService = inject(IndexedDbService);
  private readonly loaderService = inject(LoaderService);
  private readonly logService = inject(LogService);

  /* Variables */
  event = signal<Doc<Event> | null | undefined>(undefined);
  mergeChallenges = signal<MergeChallenge[]>([]);
  lastQrcode = signal<Qrcode | undefined>(undefined);

  /* Variables camera*/
  errorMessage = signal<'NO_CAMERA' | 'NO_PERMISSION' | null | undefined>(undefined);
  cameras = signal<MediaDeviceInfo[]>([]);
  cameraSelected = signal<MediaDeviceInfo | undefined>(undefined);

  /* Constants */
  ALLOWED_FORMATS = [BarcodeFormat.QR_CODE];

  /* Icons */
  ICON_EVENT = faCalendar;
  ICON_TRASH = faTrash;
  ICON_USER = faUser;
  ICON_REFRESH = faArrowsRotate;

  /* Form */
  eventForm = new FormGroup({
    code: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] })
  });
  manualScanForm = new FormGroup({
    challengeId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    userCode: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)]
    })
  });

  /* --------------------- Lifecycle hooks --------------------- */
  async ngOnInit(): Promise<void> {
    await this.initCamera();

    await this.initIndexedDB();

    if (!this.mergeChallenges().length) {
      await this.initHttp();
    }
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initIndexedDB() {
    /* Recupera l'evento se è già stato cercato */
    const dbEvent = await this.dbService.getScannerEvent();
    this.event.set(dbEvent);

    /* Recupera le sfide se presenti */
    const mergeChallenges = await this.dbService.getScannerChallenges();
    this.mergeChallenges.set(mergeChallenges);
  }

  private async initHttp() {
    await this.loaderService.executeWithDelay(async () => {
      /* Recupera le sfide per verificare che non superino il numero massimo di tentativi */
      const mergeChallenges = await this.getMergedChallenges();
      this.mergeChallenges.set(mergeChallenges);

      /* Aggiorno indexedDB */
      this.dbService.saveScannerChallenges(mergeChallenges);
    });
  }

  private async initCamera() {
    await this.loaderService.executeWithDelay(async () => {
      /* Verifico se il dispositivo supporta la camera */
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = mediaDevices.filter((device) => device.kind === 'videoinput');

        if (videoInputs.length > 0) {
          /* Ha almeno una camera, chiedo il permesso */
          await navigator.mediaDevices.getUserMedia({ video: true });
          this.errorMessage.set(null);
        } else {
          /* Non ha nessuna camera */
          this.errorMessage.set('NO_CAMERA');
        }
      } catch (error) {
        console.error("Errore nell'accesso alla fotocamera:", error);
        this.errorMessage.set('NO_PERMISSION');
      }
    });
  }

  /* --------------------- Method: firebase --------------------- */
  protected async onGetEvent(): Promise<void> {
    if (this.eventForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    await this.loaderService.executeImmediate(async () => {
      /* Ottengo evento */
      const form = trimFormValues(this.eventForm.getRawValue());
      const event = await this.eventService.getEventByCode(form.code);
      if (!event) {
        this.logService.addLogErrorApp('Nessuna evento trovato', false);
        return;
      }

      /* Memorizzo evento su locals storage */
      this.event.set(event);
      await this.dbService.saveScannerEvent(event);

      /* Reset form */
      this.eventForm.reset();

      /* Log */
      this.logService.addLogConfirm('Evento trovato');
    });
  }

  protected async onGetChallenges(): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      const mergeChallenges = await this.getMergedChallenges();
      this.mergeChallenges.set(mergeChallenges);

      /* Aggiorno indexedDB */
      this.dbService.saveScannerChallenges(mergeChallenges);

      /* Log */
      this.logService.addLogConfirm('Sfide aggiornate');
    });
  }

  protected async onScan(result: string) {
    await this.loaderService.executeImmediate(async () => {
      /* Verifico che sia il qrcode giusto */
      const qrcode = JSON.parse(result);
      if (!isQrcode(qrcode)) {
        this.logService.addLogErrorApp('Qrcode non supportato', false);
        return;
      }

      /* Verifico che non sia lo stesso qrcode precedente */
      if (isEqualQrcode(qrcode, this.lastQrcode())) return;

      /* Cerco prima se l'user ha una squadra per questo evento */
      const team = await this.teamService.getTeamById(qrcode.teamId);
      if (!team) {
        this.logService.addLogErrorApp("Squadra non trovata, l'utente non partecipa all'evento", false);
        return;
      }

      /* Eseguo scan */
      await this.scan(qrcode, team);
    });
  }

  protected async onManualScan(eventId: string) {
    await this.loaderService.executeImmediate(async () => {
      const { challengeId, userCode } = trimFormValues(this.manualScanForm.getRawValue());

      /* Ottengo l'user */
      const user = await this.userService.getUserByCode(userCode);
      if (!user) {
        this.logService.addLogErrorApp('Utente non trovato', false);
        return;
      }

      /* Cerco prima se l'user ha una squadra per questo evento */
      const team = await this.teamService.getActiveTeamByUserAndEventId(user.id, eventId);
      if (!team) {
        this.logService.addLogErrorApp("Squadra non trovata, l'utente non partecipa all'evento", false);
        return;
      }

      /* Eseguo scan */
      const qrcode: Qrcode = {
        teamId: team.id,
        userId: user.id,
        challengeId,
        points: this.mergeChallenges().find((x) => x.id === challengeId)!.points
      };
      await this.scan(qrcode, team);

      this.manualScanForm.reset();
    });
  }

  /* --------------------- Method event --------------------- */
  protected async onRemoveEvent(): Promise<void> {
    this.event.set(undefined);
    await this.dbService.deleteScannerEvent();
    await this.dbService.deleteScannerChallenges();
  }

  /* --------------------- Method util --------------------- */
  protected async scan(qrcode: Qrcode, team: Doc<Team>): Promise<void> {
    /* Memorizzo il qrcode per impedire piu scan con lo stesso valore */
    this.lastQrcode.set(qrcode);

    /* Controllo presenza della sfida */
    const mergeChallenge = this.mergeChallenges().find((x) => x.id === qrcode.challengeId);
    if (!mergeChallenge) {
      this.logService.addLogErrorApp('Sfida non trovata, aggiornare le sfide e riprovare', false);
      return;
    }

    /* Controllo che la sfida sia attiva */
    if (mergeChallenge.status !== ChallengeStatus.ACTIVE) {
      this.logService.addLogErrorApp('Sfida non attiva (disabilitata dagli admin)', false);
      return;
    }

    /* Controllo che la sfida può essere eseguita (massimo numero di volte) */
    if (mergeChallenge.maxTimes !== null) {
      const user = team.props.users.find((x) => x.id === qrcode.userId);
      if (user) {
        const userChallenge = user.challenges.find((x) => x.id === qrcode.challengeId);
        if (userChallenge && userChallenge.timestamps.length >= mergeChallenge.maxTimes) {
          this.logService.addLogErrorApp('Raggiunto limite massimo di tentativi per questa sfida', false);
          return;
        }
      }
    }

    /* Aggiorno il punteggio totale di squadra e del singolo user */
    await this.teamService.updatePoints(team, qrcode.userId, qrcode.challengeId, qrcode.points);

    /* log */
    this.logService.addLogConfirm('Sfida confermata');
  }

  protected async getMergedChallenges(): Promise<MergeChallenge[]> {
    const eventChallenges = await this.eventChallengeService.getEventChallengesByProp([
      { key: 'eventId', value: this.event()!.id }
    ]);
    const challenges = await this.challengeService.getChallengesByIds(eventChallenges.map((x) => x.props.challengeId));
    return mergeChallenges(challenges, eventChallenges);
  }

  /* --------------------- Method camera --------------------- */
  protected onCameraChange(event: EventTarget | null): void {
    /* Se nessun evento, chiudo la camera a pulisco il local storage */
    if (!event) {
      this.cameraSelected.set(undefined);
      this.lsService.removeScannerDeviceId();
      return;
    }

    /* Imposto la camera selezionata */
    const deviceId = (event as HTMLSelectElement).value;
    const newCamera = this.cameras().find((x) => x.deviceId === deviceId);

    /* Verifico se la nuova camera esiste, aggiorno il local storage */
    if (newCamera) {
      this.cameraSelected.set(newCamera);
      this.lsService.setScannerDeviceId(deviceId);
    } else {
      this.lsService.removeScannerDeviceId();
    }
  }

  protected onToggleCamera(): void {
    const lsScannerDeviceId = this.lsService.getScannerDeviceId();

    /* Se presente la camera la chiudo, viceversa seleziono la prima tra quelle disponibili */
    if (lsScannerDeviceId) {
      this.cameraSelected.set(undefined);
      this.lsService.removeScannerDeviceId();
    } else {
      const camera = this.cameras()[0] as MediaDeviceInfo | undefined;
      if (!camera) return;
      this.cameraSelected.set(camera);
      this.lsService.setScannerDeviceId(camera.deviceId);
    }
  }

  protected async handleScanSuccess(result: string): Promise<void> {
    await this.onScan(result);
  }

  protected handleScanError(error: ScanError): void {
    this.logService.addLogError('SCANNER', error);
  }

  protected handleCamerasFound(cameras: MediaDeviceInfo[]): void {
    /* Imposto le camere trovate */
    this.cameras.set(cameras);

    /* Recupero l'ID della camera selezionata dal local storage e verifico se esiste */
    const deviceId = this.lsService.getScannerDeviceId();
    const newCamera = this.cameras().find((x) => x.deviceId === deviceId);

    /* Se esiste, imposta quella come camera selezionata, altrimenti seleziona la prima camera disponibile */
    if (newCamera) this.cameraSelected.set(newCamera);
    else if (cameras.length > 0) this.cameraSelected.set(cameras[0]);
  }
}
