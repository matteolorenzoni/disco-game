import { Injectable, signal } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { LogType } from '../model/enum';

const firebaseErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': "L'email è già in uso.",
  'auth/invalid-email': "L'email inserita non è valida.",
  'auth/operation-not-allowed': 'Operazione non consentita.',
  'auth/weak-password': 'La password è troppo debole.',
  'auth/user-not-found': 'Utente non trovato.',
  'auth/wrong-password': 'Password errata.',
  'permission-denied': 'Permessi mancanti o insufficienti.',
  'resource-exhausted': 'Limite di utilizzo del database superato.',
  unavailable: 'Il servizio Firestore non è disponibile al momento. Riprovare più tardi.',
  'deadline-exceeded': "L'operazione ha impiegato troppo tempo per essere completata. Riprova.",
  'already-exists': 'Il documento esiste già nella collezione.',
  'not-found': 'Il documento specificato non è stato trovato.',
  'invalid-argument': "L'argomento fornito non è valido.",
  cancelled: "L'operazione è stata annullata.",
  'data-loss': "Dati persi o danneggiati durante l'operazione.",
  'failed-precondition': "L'operazione non è riuscita a causa di condizioni non soddisfatte.",
  aborted: "L'operazione è stata interrotta a causa di un conflitto.",
  internal: 'Si è verificato un errore interno del server.',
  unknown: 'Si è verificato un errore sconosciuto.',
  'auth/invalid-credential': 'Credenziali non valide',
  'auth/too-many-requests': 'Troppe richieste effettuate. Per favore, riprova più tardi.'
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
  /* Variables */
  logs = signal<Log[]>([]);

  public addLogConfirm(message: string, hide = true): void {
    this.addLog(LogType.OK, message, hide);
  }

  public addLogError(userId: string | undefined, error: unknown, hide = true): void {
    console.log(userId);

    let message = '';
    if (error instanceof FirebaseError) {
      message = firebaseErrorMessages[error.code] || 'Errore sconosciuto';
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    this.addLog(LogType.ERROR, message, hide);
  }

  /* ------------------ Utils ------------------ */
  public addLog(type: LogType, message: string, hide: boolean): void {
    // Usa timestamp come ID
    const id = Date.now();

    // Aggiungi il log
    this.logs.update((logs) => [...logs, { type, message, id }]);

    // Rimuovi il log dopo 3 secondi
    if (hide) setTimeout(() => this.removeLog(id), 3000);
  }

  // Metodo per rimuovere il log per ID
  public removeLog(id: number): void {
    this.logs.update((logs) => logs.filter((log) => log.id !== id));
  }
}
