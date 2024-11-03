import { inject, Injectable, signal } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { LogType } from '../model/enum';
import { AudioService } from './audio.service';

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
  tooManyTeams: 'Limite massimo di squadre creato raggiunto. Contatta il supporto.',
  usernameNotAvailable: 'Il nome utente scelto è già in uso. Scegli un nome diverso.',
  teamNameNotAvailable: 'Il nome della squadra scelto è già in uso. Scegli un nome diverso.'
};

const ERROR_UNKNOWN = 'Errore sconosciuto, riprovare o contattare assistenza';

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
  private readonly audioService = inject(AudioService);

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
    let errorMessageLog = ERROR_UNKNOWN;
    let errorMessageDebug = ERROR_UNKNOWN;

    // Gestione specifica per FirebaseError
    if (error instanceof FirebaseError) {
      errorMessageDebug = ERROR_FIREBASE[error.code] || ERROR_UNKNOWN;
      errorMessageLog = ERROR_FIREBASE[error.code] || ERROR_UNKNOWN;
    } else if (error instanceof Error) {
      if (error.cause && typeof error.cause === 'string') {
        errorMessageDebug = ERROR_CUSTOM[error.cause] || ERROR_UNKNOWN;
        errorMessageLog = ERROR_CUSTOM[error.cause] || ERROR_UNKNOWN;
      } else {
        errorMessageDebug = error.message;
      }
    } else if (typeof error === 'string') {
      errorMessageDebug = error;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessageDebug = (error as { message?: string }).message || ERROR_UNKNOWN;
      errorMessageLog = errorMessageDebug;
    }

    /* Log */
    this.addLog(LogType.ERROR, errorMessageLog, true);

    /* Debug */
    // Memorizzare solo quelli utili
    console.log('[ERROR]', userId, errorMessageDebug);
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
}
