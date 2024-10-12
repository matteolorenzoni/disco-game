import { computed, inject, Injectable, signal } from '@angular/core';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  /* Variables */
  httpRequestsActive = signal<number>(0);
  isLoader = computed(() => this.httpRequestsActive() > 0);

  /* -------------------- Methods -------------------- */
  public async execute<T>(toExecute: () => Promise<T>): Promise<T> {
    try {
      this.httpRequestsActive.update((val) => val + 1);
      return await toExecute();
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    } finally {
      this.httpRequestsActive.update((val) => val - 1);
    }
  }

  /* -------------------- Utils -------------------- */
  public updateHttpCount(count: 1 | -1) {
    this.httpRequestsActive.update((val) => val + count);
  }
}
