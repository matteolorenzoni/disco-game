import { ErrorHandler, inject, Injectable } from '@angular/core';
import { FirebaseService } from '../service/firebase.service';
import { LogService } from '../service/log.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  handleError(error: unknown): void {
    this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
    throw error;
  }
}
