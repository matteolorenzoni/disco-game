import { inject, Injectable, signal } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import packageInfo from '../../../package.json';
import { DebugType } from '../model/debug.model';
import { LogType } from '../model/enum';
import { ZxingError } from '../page/scanner/dashboard/dashboard.component';
import { AudioService } from './audio.service';
import { DebugService } from './debug.service';
import { LocalStorageService } from './local-storage.service';

export enum MessageType {
  SCONOSCIUTO,
  FIREBASE,
  CUSTOM,
  GENERALE,
  ZXING
}

const ERROR_FIREBASE: Record<string, string> = {
  // Autenticazione
  'auth/email-already-in-use': "L'email è già in uso.",
  'auth/invalid-email': "L'email inserita non è valida.",
  'auth/operation-not-allowed': 'Operazione non consentita.',
  'auth/weak-password': 'La password è troppo debole.',
  'auth/user-not-found': 'Utente non trovato.',
  'auth/wrong-password': 'Password errata.',
  'auth/invalid-credential': 'Credenziali non valide.',
  'auth/too-many-requests': 'Troppe richieste effettuate. Per favore, riprova più tardi.',

  // Permessi e risorse
  'permission-denied': 'Permessi mancanti o insufficienti.',
  'resource-exhausted': 'Limite di utilizzo del database superato.',

  // Servizio non disponibile
  unavailable: 'Il servizio Firestore non è disponibile al momento. Riprovare più tardi.',

  // Timeout e conflitti
  'deadline-exceeded': "L'operazione ha impiegato troppo tempo per essere completata. Riprova.",
  aborted: "L'operazione è stata interrotta a causa di un conflitto.",
  cancelled: "L'operazione è stata annullata.",

  // Errore interno
  internal: 'Si è verificato un errore interno del server.',
  unknown: 'Si è verificato un errore sconosciuto.',

  // Errori di dati e documenti
  'already-exists': 'Il documento esiste già nella collezione.',
  'not-found': 'Il documento specificato non è stato trovato.',
  'invalid-argument': "L'argomento fornito non è valido.",
  'data-loss': "Dati persi o danneggiati durante l'operazione.",
  'failed-precondition': "L'operazione non è riuscita a causa di condizioni non soddisfatte."
};

const ERROR_CUSTOM: Record<string, string> = {
  retry: 'Si è verificato un errore. Riprova più tardi. Se il problema persiste, contatta il supporto.',
  formNotValid: 'I valori inseriti non sono validi. Compilare tutti i campi obbligatori e riprovare.',
  noUserDocument:
    "L'utente registrato è stato trovato, ma non esiste un documento associato. Contatta il supporto per assistenza.",
  noDocument: 'Documento non trovato. Contatta il supporto per assistenza.',
  tooManyDocuments: 'Trovato più di un documento, contattare assistenza',
  documentNotActive:
    'Il documento non è attivo perché è stato precedentemente eliminato. Contatta il supporto per assistenza.',
  tooManyEvents: 'Limite massimo di eventi creati raggiunto. Contatta il supporto.',
  tooManyTeams: 'Limite massimo di squadre creato raggiunto. Contatta il supporto.'
};

const ERROR_UNKNOWN = 'Errore sconosciuto, riprovare o contattare assistenza';

const ERROR_ZXING: Record<string, string> = {
  // Questo errore si verifica quando non ci sono informazioni sul tipo di errore (message = false).
  // Può accadere in situazioni generiche di errore durante la scansione (ad esempio, flusso video non disponibile o altro problema non identificato).
  false: 'Errore durante la scansione, chiudere e riprovare',

  // Questo errore specifico si verifica quando la fotocamera non può essere avviata correttamente.
  // È spesso dovuto a un problema con l'accesso alla fotocamera del dispositivo, come:
  // - I permessi della fotocamera non sono stati concessi.
  // - La fotocamera è già in uso da un'altra applicazione.
  // - Problemi hardware o connessi a driver.
  'NotReadableError: Could not start video source': 'Impossibile avviare la fotocamera, chiudere e riprovare'
};

export type Log = {
  id: number;
  type: LogType;
  message: string;
};

@Injectable({
  providedIn: 'root'
})
export class LogService {
  /* Service */
  private readonly debugService = inject(DebugService);
  private readonly audioService = inject(AudioService);
  private readonly lsService = inject(LocalStorageService);

  /* Variables */
  logs = signal<Log[]>([]);
  audio = signal({
    ok: new Audio('audio/ok.mp3'),
    error: new Audio('audio/error.mp3')
  });

  public addLogConfirm(message: string, hide = true): void {
    this.addLog(LogType.OK, message, hide);
  }

  public addLogError(userId: string | undefined, error: unknown): void {
    let messageType = MessageType.SCONOSCIUTO;
    let errorMessageLog = ERROR_UNKNOWN;
    let errorMessageDebug = typeof error === 'string' ? error : JSON.stringify(error);

    /* ------------- Gestione errore ------------- */
    if (error instanceof FirebaseError) {
      // Errore firebase
      messageType = MessageType.FIREBASE;
      errorMessageLog = ERROR_FIREBASE[error.code] || ERROR_UNKNOWN;
    } else if (error instanceof Error && error.cause && typeof error.cause === 'string') {
      // Errore custom
      messageType = MessageType.CUSTOM;
      errorMessageDebug = error.toString();
      errorMessageLog = ERROR_CUSTOM[error.cause] || ERROR_UNKNOWN;
    } else if (error instanceof Error) {
      // Errore generale
      messageType = MessageType.GENERALE;
      errorMessageDebug = error.toString();
    }

    /* ------------- Log ------------- */
    // Visualizza toast di errore
    this.addLog(LogType.ERROR, errorMessageLog, true);

    /* ------------- Debug ------------- */
    // Memorizzare nel db solo quelli utili
    if (error instanceof FirebaseError && error.code.includes('auth')) return;

    // Aggiunge log a db
    const user = this.lsService.getUser();
    this.debugService.add({
      type: DebugType.ERROR,
      userId: userId ?? null,
      userInfo: user ? `${user.props.name} ${user.props.lastName}` : null,
      url: window.location.href,
      messageType: messageType.toString(),
      messageLog: errorMessageLog,
      messageDebug: errorMessageDebug,
      stackTrace: error instanceof Error && error.stack ? error.stack : null,
      device: this.getDevice(),
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      isLogged: !NO_LOG_ERRORS.includes(errorMessageDebug),
      appVersion: packageInfo.version,
      updatedAt: new Date()
    });
  }

  public addLogErrorZxing(userId: string | undefined, error: ZxingError): void {
    const messageType = MessageType.ZXING;
    const errorMessageLog = ERROR_ZXING[error.message] ?? 'Errore scanner, riprovare';
    const errorMessageDebug = error.message;

    /* ------------- Log ------------- */
    // Visualizza toast di errore
    this.addLog(LogType.ERROR, errorMessageLog, true);

    /* ------------- Debug ------------- */
    // Memorizzare nel db solo quelli utili
    if (ERROR_ZXING[error.message] !== undefined) return;

    // Aggiunge log a db
    const user = this.lsService.getUser();
    this.debugService.add({
      type: DebugType.ERROR,
      userId: userId ?? null,
      userInfo: user ? `${user.props.name} ${user.props.lastName}` : null,
      url: window.location.href,
      messageType: messageType.toString(),
      messageLog: errorMessageLog,
      messageDebug: errorMessageDebug,
      stackTrace: error instanceof Error && error.stack ? error.stack : null,
      device: this.getDevice(),
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      isLogged: !NO_LOG_ERRORS.includes(errorMessageDebug),
      appVersion: packageInfo.version,
      updatedAt: new Date()
    });
  }

  public addLogErrorApp(message: string, hide = true): void {
    this.addLog(LogType.ERROR, message, hide);
  }

  /* ------------------ Utils ------------------ */
  public addLog(type: LogType, message: string, hide: boolean): void {
    // Usa timestamp come ID
    const id = Date.now();

    // Aggiungi il log
    this.logs.update((logs) => [...logs, { type, message, id }]);

    // Audio
    if (type === LogType.INFO || type === LogType.OK) {
      this.audioService.playAudio('OK');
    } else {
      this.audioService.playAudio('ERROR');
    }

    // Vibrazione
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Rimuovi il log dopo 3 secondi
    if (hide) setTimeout(() => this.removeLog(id), 3000);
  }

  // Metodo per rimuovere il log per ID
  public removeLog(id: number): void {
    this.logs.update((logs) => logs.filter((log) => log.id !== id));
  }

  /* ------------------ Utils ------------------ */
  private getDevice(): string {
    return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown Browser';
    let browserVersion = 'Unknown Version';

    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      const versionMatch = userAgent.match(/Chrome\/([0-9.]+)/);
      if (versionMatch) browserVersion = versionMatch[1];
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
      const versionMatch = userAgent.match(/Version\/([0-9.]+)/);
      if (versionMatch) browserVersion = versionMatch[1];
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      const versionMatch = userAgent.match(/Firefox\/([0-9.]+)/);
      if (versionMatch) browserVersion = versionMatch[1];
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
      const versionMatch = userAgent.match(/Edg\/([0-9.]+)/);
      if (versionMatch) browserVersion = versionMatch[1];
    }

    return `${browserName} ${browserVersion}`;
  }

  // Funzione per ottenere il sistema operativo
  private getOSInfo(): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    if (/android/i.test(userAgent)) return 'Android';
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
    if (/Win/i.test(userAgent)) return 'Windows';
    if (/Mac/i.test(userAgent)) return 'MacOS';
    if (/X11/i.test(userAgent)) return 'UNIX';
    if (/Linux/i.test(userAgent)) return 'Linux';

    return 'Unknown OS';
  }
}
