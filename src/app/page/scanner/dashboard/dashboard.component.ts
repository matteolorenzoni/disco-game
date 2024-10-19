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
import { isEventTeamUserQrCode } from '../../../util/type.util';

type ScanError = {
  message: string;
  code?: number; // codice d'errore facoltativo
};

const KEY_SCANNER_EVENT = 'SCANNER_EVENT';
const KEY_SCANNER_DEVICE_ID = 'SCANNER_DEVICE_ID';

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
  readonly lsService = inject(LocalStorageService);
  readonly logService = inject(LogService);

  /* Variables */
  event = signal<Doc<Event> | undefined>(undefined);

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
    const lsEvent = this.lsService.getItem<Doc<Event>>(KEY_SCANNER_EVENT);
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
    this.lsService.setItem(KEY_SCANNER_EVENT, event);
  }

  protected onEventRemove(): void {
    this.event.set(undefined);
    this.lsService.removeItem(KEY_SCANNER_EVENT);
  }

  /* --------------------- Method camera --------------------- */
  protected onCameraChange(event: EventTarget | null): void {
    if (!event) {
      this.onCameraClose();
      return;
    }

    /* Imposto la camera selezionata */
    const deviceId = (event as HTMLSelectElement).value;
    const newCamera = this.cameras().find((x) => x.deviceId === deviceId);
    this.cameraSelected.set(newCamera);

    /* Aggiorno il local storage */
    if (newCamera) this.lsService.setItem(KEY_SCANNER_DEVICE_ID, deviceId);
    else this.lsService.removeItem(KEY_SCANNER_DEVICE_ID);
  }

  protected onCameraClose(): void {
    this.cameraSelected.set(undefined);
    this.lsService.removeItem(KEY_SCANNER_DEVICE_ID);
  }

  protected async handleScanSuccess(result: string): Promise<void> {
    alert(result);
    const value = JSON.parse(result);
    if (!isEventTeamUserQrCode(value)) return;

    await this.eventTeamUserService.updateChallengePoints(value);
    this.logService.addLogConfirm('Sfida confermata');
  }

  protected handleScanError(error: ScanError): void {
    alert(error.message);
  }

  protected handleCamerasFound(cameras: MediaDeviceInfo[]): void {
    /* Imposto le camere trovate */
    this.cameras.set(cameras);

    /* Imposto la camera selezionata */
    const deviceId = this.lsService.getItem<string>(KEY_SCANNER_DEVICE_ID);
    const newCamera = this.cameras().find((x) => x.deviceId === deviceId);
    this.cameraSelected.set(newCamera);
  }
}
