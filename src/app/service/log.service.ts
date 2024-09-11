import { Injectable } from '@angular/core';
import { LogType } from '../model/enum.model';

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
  unknown: 'Si è verificato un errore sconosciuto.'
};

@Injectable({
  providedIn: 'root'
})
export class LogService {
  public addLog(type: LogType, message: string): void {
    console.log(type, message);
  }

  public addLogFirebase(type: LogType, code: string): void {
    const translation = firebaseErrorMessages[code];
    console.log(type, translation);
  }
}
