/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { TitleComponent } from '../../../components/title/title.component';
import { FvFieldIconComponent } from '../../../components/fv-field-icon.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { EventService } from '../../../service/event.service';
import { LogService } from '../../../service/log.service';
import { LocalStorageService } from '../../../service/local-storage.service';
import { TeamService } from '../../../service/team.service';
import { ChallengeService } from '../../../service/challenge.service';
import { EventChallengeService } from '../../../service/event-challenge.service';
import { UserService } from '../../../service/user.service';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase';
import { ChallengeStatus, EventChallenge, Qrcode } from '../../../model/event-challenge.model';
import { isSameQrcode, isQrcode } from '../../../util/type.util';
import { Team, TeamStatus } from '../../../model/team.model';
import { LoaderService } from '../../../service/loader.service';
import { trimFormValues } from '../../../util/utils';
import { IndexedDbService } from '../../../service/indexed-db.service';
import { MergeChallenge, mergeChallenges } from '../../../util/merge.util';
import { Challenge } from '../../../model/challenge.model';
import { FirebaseService } from '../../../service/firebase.service';

type ScanError = {
  message: string;
  code?: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TitleComponent,
    FvFieldIconComponent,
    FvButtonComponent,
    FaIconComponent,
    ZXingScannerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  /* Services */
  private readonly firebaseService = inject(FirebaseService);
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
  challenges = signal<Doc<Challenge>[]>([]);
  eventChallenges = signal<Doc<EventChallenge>[]>([]);
  mergeChallenges = computed<MergeChallenge[]>(() => {
    const challenges = this.challenges();
    const eventChallenges = this.eventChallenges();
    if (!challenges.length || !eventChallenges.length) return [];
    return mergeChallenges(challenges, eventChallenges);
  });
  lastQrcode = signal<Qrcode | undefined>(undefined);

  /* Variables camera*/
  hasPermissions = signal<boolean | undefined>(undefined);
  hasCameras = signal<boolean | undefined>(undefined);
  cameras = signal<MediaDeviceInfo[]>([]);
  deviceId = signal<string | undefined>(undefined);
  device = computed<MediaDeviceInfo | undefined>(() => {
    const cameras = this.cameras();
    const deviceId = this.deviceId();
    return cameras.find((x) => x.deviceId === deviceId);
  });
  scanError = signal<ScanError | undefined>(undefined);

  /* Constants */
  ALLOWED_FORMATS = [BarcodeFormat.QR_CODE];
  NOW = new Date();

  /* Ref */
  challengeUnsubscribe?: () => void;
  eventChallengeUnsubscribe?: () => void;

  /* Icons */
  ICON_EVENT = faCalendar;
  ICON_TRASH = faTrash;
  ICON_USER = faUser;

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
    await this.initIndexedDB();

    await this.initHttp();
  }

  ngOnDestroy(): void {
    if (this.challengeUnsubscribe) this.challengeUnsubscribe();
    if (this.eventChallengeUnsubscribe) this.eventChallengeUnsubscribe();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initIndexedDB() {
    /* Recupera l'evento se è già stato cercato */
    const dbEvent = await this.dbService.getScannerEvent();
    this.event.set(dbEvent);
  }

  private async initHttp() {
    const event = this.event();
    if (!event) return;

    // Rimane in ascolto sulle sfide
    if (this.challengeUnsubscribe) this.challengeUnsubscribe();
    this.challengeUnsubscribe = this.challengeService.subscribeChallenges(async (challenges) =>
      this.challenges.set(challenges)
    );

    // Rimane in ascolto sulle sfide associate all'evento
    if (this.eventChallengeUnsubscribe) this.eventChallengeUnsubscribe();
    this.eventChallengeUnsubscribe = this.eventChallengeService.subscribeEventChallengesByProp(
      [{ key: 'eventId', value: event.id }],
      async (eventChallenges) => this.eventChallenges.set(eventChallenges)
    );
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

      /* Aggiorno indexedDB */
      this.event.set(event);
      await this.dbService.saveScannerEvent(event);

      /* Reset form */
      this.eventForm.reset();

      /* Log */
      this.logService.addLogConfirm('Evento trovato');
    });
  }

  protected async onScan(result: string) {
    await this.loaderService.executeImmediate(async () => {
      const qrcode = JSON.parse(result);
      const lastQrcode = this.lastQrcode();

      /* Memorizzo il qrcode per impedire piu scan con lo stesso valore */
      this.lastQrcode.set(qrcode);

      /* Verifico che non sia lo stesso qrcode precedente */
      if (isSameQrcode(lastQrcode, qrcode)) return;

      /* Verifico che sia il qrcode giusto */
      if (!isQrcode(qrcode)) {
        this.logService.addLogErrorApp('Qrcode non supportato', false);
        return;
      }

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
      const team = await this.teamService.getActiveTeamByUserIdAndEventId(user.id, eventId);
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
    this.event.set(null);
    this.challenges.set([]);
    this.eventChallenges.set([]);
    await this.dbService.deleteScannerEvent();
  }

  protected async onRefreshPage(): Promise<void> {
    window.location.reload();
  }

  protected onCameraChange(event: EventTarget | null): void {
    /* Se nessun evento, chiudo la camera e pulisco il local storage */
    if (!event) {
      this.deviceId.set(undefined);
      this.lsService.removeScannerDeviceId();
      return;
    }

    /* Imposto la camera selezionata */
    const deviceId = (event as HTMLSelectElement).value;
    this.deviceId.set(deviceId);
    this.lsService.setScannerDeviceId(deviceId);
  }

  /* --------------------- Method util --------------------- */
  protected async scan(qrcode: Qrcode, team: Doc<Team>): Promise<void> {
    /* Controllo se la squadra è attiva */
    if (team.props.status !== TeamStatus.ACTIVE) {
      this.logService.addLogErrorApp('Squadra non attiva (disattivata dagli admin)', false);
      return;
    }

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

    /* Controllo che la sfida sia gia iniziata (se presente) */
    if (mergeChallenge.startDate !== null && mergeChallenge.startDate.getTime() > new Date().getTime()) {
      this.logService.addLogErrorApp('Sfida non iniziata (attendere orario inizio)', false);
      return;
    }

    /* Controllo che la sfida non sia terminata (se presente) */
    if (mergeChallenge.endDate !== null && mergeChallenge.endDate.getTime() < new Date().getTime()) {
      this.logService.addLogErrorApp('Sfida terminata (fuori orario)', false);
      return;
    }

    /* Controllo l'orario di inizio della sfida (se presente) */
    if (mergeChallenge.startDate !== null) {
      if (mergeChallenge.startDate.getDate() > new Date().getTime()) {
        this.logService.addLogErrorApp('Sfida non ancora iniziata', false);
        return;
      }
    }

    /* Controllo che la sfida non abbia raggiunto il numero massimo di tentativi (se presente) */
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
    await this.teamService.updateUserPoints(team, qrcode.userId, qrcode.challengeId, qrcode.points);

    /* log */
    this.logService.addLogConfirm('Sfida confermata', false);
  }

  /* --------------------- Method camera --------------------- */

  protected onToggleCamera(): void {
    const lsScannerDeviceId = this.lsService.getScannerDeviceId();

    /* Se la camera è presente allora la chiudo, viceversa seleziono la prima tra quelle disponibili */
    if (lsScannerDeviceId) {
      this.deviceId.set(undefined);
      this.lsService.removeScannerDeviceId();
    } else {
      const camera = this.cameras()[0] as MediaDeviceInfo | undefined;
      if (!camera) return;
      this.deviceId.set(camera.deviceId);
      this.lsService.setScannerDeviceId(camera.deviceId);
    }
  }

  protected handlePermissionResponse(isPermission: boolean): void {
    this.hasPermissions.set(isPermission);
  }

  protected handleCamerasFound(cameras: MediaDeviceInfo[]): void {
    /* Imposto le camere trovate */
    this.cameras.set(cameras);
    this.hasCameras.set(cameras.length > 0);

    /* Recupero l'ID della camera selezionata dal local storage e verifico se esiste */
    /* Se esiste, imposta quella come camera selezionata, altrimenti seleziona la prima camera disponibile */
    const deviceId = this.lsService.getScannerDeviceId();
    if (deviceId) this.deviceId.set(deviceId);
    else if (cameras.length > 0) {
      const { deviceId } = cameras[0];
      this.deviceId.set(deviceId);
      this.lsService.setScannerDeviceId(deviceId);
    } else {
      this.deviceId.set(undefined);
      this.lsService.removeScannerDeviceId();
    }
  }

  protected async handleScanSuccess(result: string): Promise<void> {
    await this.onScan(result);
  }

  protected handleScanError(scanError: ScanError): void {
    this.scanError.set(scanError);
    this.logService.addLogError(this.firebaseService.userFirebase()?.uid, scanError);
  }
}
