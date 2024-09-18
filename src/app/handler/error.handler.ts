import { ErrorHandler, inject, Injectable } from '@angular/core';
import { FirebaseService } from '../service/firebase.service';
import { LogService } from '../service/log.service';

const errorMessages: Record<string, string> = {
  retry: "E' avvenuto un errore, riprova più tardi. Se persiste contattare il supporto per assistenza.",
  formNotValid: 'Il modulo non è valido. Controlla i campi evidenziati e riprova.',
  noUserDocument:
    "L'utente registrato è stato trovato ma non esiste un documento associato. Contattare il supporto per assistenza.",
  noDocument: 'Documento non trovato. Contattare il supporto per assistenza.'
};

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  handleError(error: unknown): void {
    if (error instanceof Error && error.cause && typeof error.cause === 'string') {
      const message = errorMessages[error?.cause];
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, message, false);
    }

    throw error;
  }
}
