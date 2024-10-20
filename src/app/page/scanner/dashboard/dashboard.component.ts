/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowsRotate, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { TitleComponent } from '../../../components/title/title.component';
import { FvFieldIconComponent } from '../../../components/fv-field-icon.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { EventService } from '../../../service/event.service';
import { LogService } from '../../../service/log.service';
import { FirebaseService } from '../../../service/firebase.service';
import { LocalStorageService } from '../../../service/local-storage.service';
import { EventTeamUserService } from '../../../service/event-team-user.service';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase';
import { isEqualQrcode, isQrcode } from '../../../util/type.util';
import { TeamService } from '../../../service/team.service';
import { Qrcode } from '../../../model/event-challenge.model';

type ScanError = {
  message: string;
  code?: number; // codice d'errore facoltativo
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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
export class DashboardComponent implements OnInit {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly eventService = inject(EventService);
  readonly eventTeamUserService = inject(EventTeamUserService);
  readonly teamService = inject(TeamService);
  readonly lsService = inject(LocalStorageService);
  readonly logService = inject(LogService);

  /* Variables */
  event = signal<Doc<Event> | undefined>(undefined);
  lasQrcode = signal<Qrcode | undefined>(undefined);

  /* Variables camera*/
  errorMessage = signal<'NO_CAMERA' | 'NO_PERMISSION' | null | undefined>(undefined);
  cameras = signal<MediaDeviceInfo[]>([]);
  cameraSelected = signal<MediaDeviceInfo | undefined>(undefined);

  /* Constants */
  ALLOWED_FORMATS = [BarcodeFormat.QR_CODE];

  /* Icons */
  ICON_EVENT = faCalendar;
  ICON_CHANGE = faArrowsRotate;

  /* Form */
  eventForm = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  /* --------------------- Lifecycle hooks --------------------- */
  async ngOnInit(): Promise<void> {
    /* Recupera l'evento se è già stato cercato */
    const lsEvent = this.lsService.getScannerEvent();
    this.event.set(lsEvent ?? undefined);

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
  }

  /* --------------------- Method event --------------------- */
  protected async onGetEvent(): Promise<void> {
    if (this.eventForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    /* Ottengo evento */
    const form = this.eventForm.getRawValue();
    const event = await this.eventService.getEventByCode(form.code);
    if (!event) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, 'Nessuna evento trovato');
      return;
    }

    /* Memorizzo evento su locals storage */
    this.event.set(event);
    this.lsService.setScannerEvent(event);
  }

  protected onEventRemove(): void {
    this.event.set(undefined);
    this.lsService.removeScannerEvent();
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
    /* Verifico che sia il qrcode giusto */
    const qrcode = JSON.parse(result);
    if (!isQrcode(qrcode)) return;

    /* Verifico che non sia lo stesso qrcode precedente */
    if (isEqualQrcode(qrcode, this.lasQrcode())) return;

    /* Memorizzo il qrcode per impedire piu scan con lo stesso valore */
    this.lasQrcode.set(qrcode);

    /* Aggiorno eventTeamUser e squadra associati */
    await this.eventTeamUserService.updateChallengePoints(qrcode);
    await this.teamService.updateTeamPoints(qrcode.teamId, qrcode.points);
    this.logService.addLogConfirm('Sfida confermata');
  }

  protected handleScanError(error: ScanError): void {
    this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
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
